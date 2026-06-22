export type SkillsImportPreviewSummaryTone = "ok" | "warn" | "error";

export interface SkillsImportPreviewSummaryInput {
  totalCount: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  warningCount: number;
}

export interface SkillsImportPreviewSummary {
  statusLabel: string;
  statusTone: SkillsImportPreviewSummaryTone;
  headline: string;
  detail: string;
  nextAction: string;
}

function plural(value: number, singular: string, pluralValue = `${singular}s`) {
  return value === 1 ? singular : pluralValue;
}

export function buildSkillsImportPreviewSummary(
  input: SkillsImportPreviewSummaryInput,
): SkillsImportPreviewSummary {
  if (input.totalCount <= 0) {
    return {
      statusLabel: "Empty preview",
      statusTone: "warn",
      headline: "No importable skills found.",
      detail:
        "Choose another source or check that the source contains SKILL.md files.",
      nextAction: "Choose another source",
    };
  }

  if (input.invalidCount > 0) {
    return {
      statusLabel: "Needs fixes",
      statusTone: "error",
      headline: `${input.invalidCount} ${plural(
        input.invalidCount,
        "skill",
      )} ${input.invalidCount === 1 ? "needs" : "need"} fixes before import.`,
      detail:
        "Fix invalid skill metadata or content, then preview this source again.",
      nextAction: "Fix invalid skills",
    };
  }

  const hasDuplicates = input.duplicateCount > 0;
  const hasWarnings = input.warningCount > 0;

  if (hasDuplicates || hasWarnings) {
    const suffix =
      hasDuplicates && hasWarnings
        ? "duplicates and warnings"
        : hasDuplicates
          ? "duplicates"
          : "warnings";

    return {
      statusLabel: "Review",
      statusTone: "warn",
      headline: `${input.validCount} valid ${plural(
        input.validCount,
        "skill",
      )} found with ${suffix}.`,
      detail:
        hasDuplicates && hasWarnings
          ? "Review duplicate handling and warnings before applying this import."
          : hasDuplicates
            ? "Review duplicate handling before applying this import."
            : "Review warnings before applying this import.",
      nextAction:
        hasDuplicates && hasWarnings
          ? "Review import choices"
          : hasDuplicates
            ? "Review duplicates"
            : "Review warnings",
    };
  }

  return {
    statusLabel: "Ready",
    statusTone: "ok",
    headline: `${input.validCount} valid ${plural(
      input.validCount,
      "skill",
    )} ${input.validCount === 1 ? "is" : "are"} ready to import.`,
    detail: "Apply this preview when you are ready. The index will be marked stale.",
    nextAction: "Apply import",
  };
}
