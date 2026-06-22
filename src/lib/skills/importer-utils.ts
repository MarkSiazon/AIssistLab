import type { SkillFrontmatter } from "@/types/skill";
import { parseFrontmatter } from "@/lib/markdown/frontmatter";
import { normalizeSkillTags } from "@/lib/skills/reader";
import type { DuplicateStrategy, ImportCandidate } from "./importer-types";

export function sanitizeDisplayPath(value: string): string {
  const home = process.env.USERPROFILE ?? process.env.HOME;
  let output = value.replace(/\\/g, "/");
  if (home) output = output.replace(home.replace(/\\/g, "/"), "~");
  return output
    .replace(/[A-Z]:\/Users\/[^/]+/gi, "~")
    .replace(/\/Users\/[^/]+/gi, "~")
    .replace(/\/home\/[^/]+/gi, "~");
}

export function sanitizeImportErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof Error)) return fallback;
  return sanitizeDisplayPath(error.message);
}

export function isDuplicateStrategy(value: string): value is DuplicateStrategy {
  return value === "skip" || value === "overwrite" || value === "rename";
}

export function normalizeImportedSkillName(value: string): string {
  return value
    .replace(/\.md$/i, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 63);
}

export function isImportMarkdown(name: string): boolean {
  return name.toLowerCase().endsWith(".md");
}

export function candidateFromRaw(
  nameHint: string,
  raw: string,
  fileCount: number,
): ImportCandidate | null {
  const parsed = parseFrontmatter(raw);
  const name =
    typeof parsed.data.name === "string"
      ? normalizeImportedSkillName(parsed.data.name)
      : normalizeImportedSkillName(nameHint);
  if (!name) return null;

  return {
    name,
    displayName: `${name}.md`,
    fileCount,
    frontmatter: {
      ...parsed.data,
      description:
        typeof parsed.data.description === "string"
          ? parsed.data.description
          : "",
      tags: normalizeSkillTags(parsed.data.tags),
    } as SkillFrontmatter,
    frontmatterParseError: parsed.error ?? null,
    body: parsed.content,
    raw,
  };
}
