import { createHash, randomBytes } from "node:crypto";
import type { Skill } from "@/types/skill";
import { readSkill } from "@/lib/skills/reader";
import { writeSkill } from "@/lib/skills/writer";
import { buildSkillQualityReport } from "./quality";
import { isSafeSkillName, validateSkillInput } from "./validation";
import {
  readImportPreviewCache,
  writeImportPreviewCache,
} from "./importer-cache";
import { collectImportCandidates } from "./importer-sources";
import {
  isDuplicateStrategy,
  sanitizeDisplayPath,
} from "./importer-utils";
import {
  MAX_IMPORT_FILES,
  type DuplicateStrategy,
  type ImportCandidate,
  type SkillImportPreview,
  type SkillImportPreviewItem,
  type SkillImportSource,
  type StoredPreview,
} from "./importer-types";

export { sanitizeImportErrorMessage } from "./importer-utils";
export type {
  DuplicateStrategy,
  SkillImportPreview,
  SkillImportSource,
} from "./importer-types";

function makePreviewId(candidates: ImportCandidate[]): string {
  const hash = createHash("sha256")
    .update(JSON.stringify(candidates.map((item) => [item.name, item.raw.length])))
    .update(randomBytes(8))
    .digest("hex")
    .slice(0, 24);
  return `preview-${hash}`;
}

async function publicItems(
  candidates: ImportCandidate[],
): Promise<SkillImportPreviewItem[]> {
  return Promise.all(
    candidates.map(async (candidate) => {
      const validation = validateSkillInput({
        name: candidate.name,
        frontmatter: candidate.frontmatter,
        frontmatterParseError: candidate.frontmatterParseError,
        body: candidate.body,
      });
      const skill: Skill = {
        name: candidate.name,
        filePath: "",
        frontmatter: candidate.frontmatter,
        body: candidate.body,
        raw: candidate.raw,
        updatedAt: new Date(0).toISOString(),
      };
      const quality = buildSkillQualityReport([skill]);
      return {
        name: candidate.name,
        displayName: candidate.displayName,
        hasSkillFile: true,
        fileCount: candidate.fileCount,
        validationErrors: validation.errors,
        qualityWarnings: quality.issues.filter(
          (issue) => issue.severity === "warn",
        ),
        duplicate: Boolean(await readSkill(candidate.name)),
      };
    }),
  );
}

function sourceDisplay(source: SkillImportSource): string {
  if (source.sourceType === "folder") {
    return sanitizeDisplayPath(source.path);
  }
  if (source.sourceType === "archive") {
    return source.fileName ?? "archive";
  }
  return "GitHub URL";
}

export async function createSkillImportPreview(
  source: SkillImportSource,
): Promise<SkillImportPreview> {
  const candidates = await collectImportCandidates(source);
  const previewId = makePreviewId(candidates);
  const skills = await publicItems(candidates);
  const preview: StoredPreview = {
    ok: skills.every((item) => item.validationErrors.length === 0),
    previewId,
    sourceType: source.sourceType,
    sourceDisplay: sourceDisplay(source),
    skills,
    warnings:
      candidates.length >= MAX_IMPORT_FILES
        ? [`Only the first ${MAX_IMPORT_FILES} markdown files were scanned.`]
        : [],
    candidates,
  };
  const cache = await readImportPreviewCache();
  cache[previewId] = preview;
  await writeImportPreviewCache(cache);

  return {
    ok: preview.ok,
    previewId: preview.previewId,
    sourceType: preview.sourceType,
    sourceDisplay: preview.sourceDisplay,
    skills: preview.skills,
    warnings: preview.warnings,
  };
}

async function uniqueSkillName(baseName: string): Promise<string> {
  let counter = 2;
  let candidate = `${baseName}-${counter}`;
  while (await readSkill(candidate)) {
    counter += 1;
    candidate = `${baseName}-${counter}`;
  }
  return candidate;
}

export async function applySkillImportPreview(input: {
  previewId: string;
  confirm: boolean;
  duplicateStrategy: DuplicateStrategy | string;
}): Promise<{
  ok: true;
  written: string[];
  skipped: string[];
  renamed: Array<{ from: string; to: string }>;
}> {
  if (!input.confirm) throw new Error("Import confirmation is required.");
  if (!isDuplicateStrategy(input.duplicateStrategy)) {
    throw new Error("Invalid duplicate strategy.");
  }
  const cache = await readImportPreviewCache();
  const preview = cache[input.previewId];
  if (!preview) throw new Error("Import preview was not found.");
  if (!preview.ok || preview.skills.some((item) => item.validationErrors.length > 0)) {
    throw new Error("Import preview contains validation errors.");
  }

  const written: string[] = [];
  const skipped: string[] = [];
  const renamed: Array<{ from: string; to: string }> = [];

  for (const candidate of preview.candidates) {
    if (!isSafeSkillName(candidate.name)) {
      skipped.push(candidate.name);
      continue;
    }
    const exists = Boolean(await readSkill(candidate.name));
    let targetName = candidate.name;
    if (exists && input.duplicateStrategy === "skip") {
      skipped.push(candidate.name);
      continue;
    }
    if (exists && input.duplicateStrategy === "rename") {
      targetName = await uniqueSkillName(candidate.name);
      renamed.push({ from: candidate.name, to: targetName });
    }
    await writeSkill(targetName, candidate.frontmatter, candidate.body);
    written.push(targetName);
  }

  delete cache[input.previewId];
  await writeImportPreviewCache(cache);
  return { ok: true, written, skipped, renamed };
}
