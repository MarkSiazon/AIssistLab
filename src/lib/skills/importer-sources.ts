import fs from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";
import type { ImportCandidate, SkillImportSource } from "./importer-types";
import {
  MAX_ARCHIVE_BYTES,
  MAX_FILE_BYTES,
  MAX_IMPORT_FILES,
} from "./importer-types";
import { candidateFromRaw, isImportMarkdown } from "./importer-utils";

function rejectUnsafeEntryName(name: string): void {
  const normalized = name.replace(/\\/g, "/");
  if (
    normalized.startsWith("/") ||
    /^[a-z]:\//i.test(normalized) ||
    normalized.split("/").includes("..")
  ) {
    throw new Error("Archive contains path traversal entry.");
  }
}

async function readBoundedResponseText(
  response: Response,
  source: string,
): Promise<string> {
  const contentLength = response.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_FILE_BYTES) {
    throw new Error(`${source} is too large.`);
  }
  if (!response.body) {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_FILE_BYTES) {
      throw new Error(`${source} is too large.`);
    }
    return buffer.toString("utf-8");
  }

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_FILE_BYTES) {
      throw new Error(`${source} is too large.`);
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks, totalBytes).toString("utf-8");
}

async function collectFolderCandidates(
  folderPath: string,
): Promise<ImportCandidate[]> {
  if (!folderPath?.trim()) throw new Error("Folder path is required.");
  const root = path.resolve(folderPath);
  const candidates: ImportCandidate[] = [];

  async function walk(current: string, depth: number): Promise<void> {
    if (depth > 3 || candidates.length >= MAX_IMPORT_FILES) return;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (candidates.length >= MAX_IMPORT_FILES) break;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, depth + 1);
        continue;
      }
      if (!entry.isFile() || !isImportMarkdown(entry.name)) continue;
      const stat = await fs.stat(fullPath);
      if (stat.size > MAX_FILE_BYTES) continue;
      const raw = await fs.readFile(fullPath, "utf-8");
      const nameHint =
        entry.name.toLowerCase() === "skill.md"
          ? path.basename(path.dirname(fullPath))
          : entry.name;
      const candidate = candidateFromRaw(nameHint, raw, 1);
      if (candidate) candidates.push(candidate);
    }
  }

  await walk(root, 0);
  return candidates;
}

function collectArchiveCandidates(archiveBase64: string): ImportCandidate[] {
  if (!archiveBase64?.trim()) throw new Error("Archive file is required.");
  const archive = Buffer.from(archiveBase64, "base64");
  if (archive.length > MAX_ARCHIVE_BYTES) {
    throw new Error("Archive is too large.");
  }

  const candidates: ImportCandidate[] = [];
  let offset = 0;
  while (offset + 30 <= archive.length && candidates.length < MAX_IMPORT_FILES) {
    const signature = archive.readUInt32LE(offset);
    if (signature !== 0x04034b50) break;
    const method = archive.readUInt16LE(offset + 8);
    const compressedSize = archive.readUInt32LE(offset + 18);
    const uncompressedSize = archive.readUInt32LE(offset + 22);
    const nameLength = archive.readUInt16LE(offset + 26);
    const extraLength = archive.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const nameEnd = nameStart + nameLength;
    const dataStart = nameEnd + extraLength;
    const dataEnd = dataStart + compressedSize;
    const entryName = archive.subarray(nameStart, nameEnd).toString("utf-8");
    rejectUnsafeEntryName(entryName);

    if (dataEnd > archive.length) throw new Error("Archive entry is truncated.");
    if (isImportMarkdown(entryName) && uncompressedSize <= MAX_FILE_BYTES) {
      const compressed = archive.subarray(dataStart, dataEnd);
      let content: Buffer | null = null;
      try {
        content =
          method === 0
            ? compressed
            : method === 8
              ? inflateRawSync(compressed, {
                  maxOutputLength: MAX_FILE_BYTES + 1,
                })
              : null;
      } catch {
        throw new Error("Archive entry is too large.");
      }
      if (content) {
        if (content.length > MAX_FILE_BYTES) {
          throw new Error("Archive entry is too large.");
        }
        const baseName =
          path.posix.basename(entryName).toLowerCase() === "skill.md"
            ? path.posix.basename(path.posix.dirname(entryName))
            : path.posix.basename(entryName);
        const candidate = candidateFromRaw(
          baseName,
          content.toString("utf-8"),
          1,
        );
        if (candidate) candidates.push(candidate);
      }
    }

    offset = dataEnd;
  }

  return candidates;
}

async function collectGithubCandidates(url: string): Promise<ImportCandidate[]> {
  if (!url?.trim()) throw new Error("GitHub URL is required.");
  const parsed = new URL(url);
  if (!["github.com", "raw.githubusercontent.com"].includes(parsed.hostname)) {
    throw new Error("Only GitHub URLs are supported.");
  }

  if (parsed.hostname === "raw.githubusercontent.com") {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Unable to fetch GitHub file.");
    const raw = await readBoundedResponseText(response, "GitHub file");
    const nameHint = path.posix.basename(parsed.pathname);
    const candidate = candidateFromRaw(nameHint, raw, 1);
    return candidate ? [candidate] : [];
  }

  const parts = parsed.pathname.split("/").filter(Boolean);
  const [owner, repo, mode, branch, ...rest] = parts;
  if (!owner || !repo || !mode || !branch) {
    throw new Error("GitHub URL must point to a file or folder.");
  }
  const targetPath = rest.join("/");

  if (mode === "blob") {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${targetPath}`;
    return collectGithubCandidates(rawUrl);
  }

  if (mode !== "tree") {
    throw new Error("GitHub URL must point to a file or folder.");
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${targetPath}?ref=${encodeURIComponent(branch)}`;
  const response = await fetch(apiUrl, {
    headers: { "User-Agent": "skill-workshop-rag" },
  });
  if (!response.ok) throw new Error("Unable to fetch GitHub folder.");
  const entries = (await response.json()) as Array<{
    type: string;
    name: string;
    download_url: string | null;
    size: number;
  }>;

  const candidates: ImportCandidate[] = [];
  for (const entry of entries.slice(0, MAX_IMPORT_FILES)) {
    if (
      entry.type !== "file" ||
      !entry.download_url ||
      !isImportMarkdown(entry.name) ||
      entry.size > MAX_FILE_BYTES
    ) {
      continue;
    }
    const fileResponse = await fetch(entry.download_url);
    if (!fileResponse.ok) continue;
    const raw = await readBoundedResponseText(fileResponse, "GitHub file");
    const candidate = candidateFromRaw(entry.name, raw, 1);
    if (candidate) candidates.push(candidate);
  }
  return candidates;
}

export async function collectImportCandidates(
  source: SkillImportSource,
): Promise<ImportCandidate[]> {
  if (source.sourceType === "folder") {
    return collectFolderCandidates(source.path);
  }
  if (source.sourceType === "archive") {
    return collectArchiveCandidates(source.archiveBase64);
  }
  return collectGithubCandidates(source.url);
}
