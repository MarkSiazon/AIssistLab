import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  getSkillsDir,
  getSkillsPath,
  getWorkspaceRoot,
} from "@/lib/skills/reader";
import { sanitizeDisplayPath } from "@/lib/rag/index-state-display";
import type { CurrentIndexConfig } from "@/lib/rag/index-state-types";

function hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeForFingerprint(value: string): string {
  return path.resolve(value).toLowerCase();
}

async function readMarkdownFileFingerprint(skillsPath: string): Promise<string> {
  try {
    const entries = await fs.readdir(skillsPath, { withFileTypes: true });
    const mdFiles = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    const parts: string[] = [];
    for (const file of mdFiles) {
      const fullPath = path.join(skillsPath, file);
      const stat = await fs.stat(fullPath);
      parts.push(`${file}:${stat.size}:${stat.mtimeMs}`);
    }
    return hash(parts.join("|"));
  } catch {
    return hash("missing-skills-dir");
  }
}

export async function getCurrentIndexConfig(): Promise<CurrentIndexConfig> {
  const workspaceRoot = getWorkspaceRoot();
  const skillsDir = getSkillsDir();
  const skillsPath = getSkillsPath();

  return {
    workspaceRoot,
    skillsDir,
    skillsPath,
    workspaceFingerprint: hash(normalizeForFingerprint(workspaceRoot)),
    skillsDirFingerprint: hash(normalizeForFingerprint(skillsPath)),
    skillFilesFingerprint: await readMarkdownFileFingerprint(skillsPath),
    workspaceDisplay: sanitizeDisplayPath(workspaceRoot),
    skillsDirDisplay: sanitizeDisplayPath(
      path.isAbsolute(skillsDir)
        ? skillsDir
        : path.join(workspaceRoot, skillsDir),
    ),
  };
}
