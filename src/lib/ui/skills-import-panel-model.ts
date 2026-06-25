import { countLabel } from "@/lib/format/count-label";

export type SkillsImportSourceType = "folder" | "archive" | "github";
export type SkillsImportDuplicateStrategy = "skip" | "overwrite" | "rename";

export interface DeletedSkillSummary {
  skillName: string;
  deletedAt: string;
}

export interface ImportPreviewItem {
  name: string;
  displayName: string;
  validationErrors: { message: string }[];
  qualityWarnings: { message: string; category?: string }[];
  duplicate: boolean;
}

export interface ImportPreview {
  ok: boolean;
  previewId: string;
  sourceType: SkillsImportSourceType;
  sourceDisplay: string;
  skills: ImportPreviewItem[];
  warnings: string[];
}

export type SkillsImportChipTone = "ok" | "warn" | "error" | undefined;

export function importChipClass(tone: SkillsImportChipTone): string {
  if (tone === "error") return "skills-import-chip-error";
  if (tone === "warn") return "skills-import-chip-warn";
  return "skills-import-chip-ok";
}

export function buildSkillsImportStats(input: {
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  warningCount: number;
}) {
  return [
    ["Valid", input.validCount],
    ["Invalid", input.invalidCount],
    ["Duplicates", input.duplicateCount],
    ["Warnings", input.warningCount],
  ] as const;
}

export function hiddenPreviewSkillMessage(input: {
  totalCount: number;
  visibleCount: number;
}): string | null {
  const hiddenCount = Math.max(0, input.totalCount - input.visibleCount);
  if (hiddenCount === 0) return null;
  return `${countLabel(hiddenCount, "more skill", "more skills")} included in this import.`;
}

export function hiddenPreviewWarningMessage(input: {
  totalCount: number;
  visibleCount: number;
}): string | null {
  const hiddenCount = Math.max(0, input.totalCount - input.visibleCount);
  if (hiddenCount === 0) return null;
  return `${countLabel(hiddenCount, "more preview warning")} hidden.`;
}
