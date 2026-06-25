import { countLabel } from "@/lib/format/count-label";
import type {
  DuplicateStrategy,
  SkillImportPreview,
  SkillImportPreviewItem,
  SkillImportSource,
} from "@/lib/skills/importer-types";
import type { DeletedSkillSummary as SkillDeletedSummary } from "@/lib/skills/trash";
import type { UiAlertTone } from "@/lib/ui/tone";

export type SkillsImportSourceType = SkillImportSource["sourceType"];
export type SkillsImportDuplicateStrategy = DuplicateStrategy;

export type DeletedSkillSummary = SkillDeletedSummary;

export type ImportPreviewItem = SkillImportPreviewItem;
export type ImportPreview = SkillImportPreview;

export type SkillsImportChipTone = UiAlertTone | undefined;

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
