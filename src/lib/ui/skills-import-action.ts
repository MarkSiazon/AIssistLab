import { countLabel } from "@/lib/format/count-label";

type SkillsImportDuplicateStrategy = "skip" | "overwrite" | "rename";

export interface SkillsImportActionInput {
  hasPreview: boolean;
  previewOk: boolean;
  isLoading: boolean;
  validationErrorCount: number;
  duplicateCount: number;
  validCount: number;
  duplicateStrategy: SkillsImportDuplicateStrategy;
  overwriteConfirmText: string;
}

export interface SkillsImportActionState {
  canApply: boolean;
  buttonLabel: string;
  blocker: string | null;
  requiresOverwriteConfirmation: boolean;
}

export function buildSkillsImportActionState(
  input: SkillsImportActionInput,
): SkillsImportActionState {
  const requiresOverwriteConfirmation =
    input.duplicateStrategy === "overwrite" && input.duplicateCount > 0;
  const overwriteConfirmed =
    input.overwriteConfirmText.trim().toLowerCase() === "overwrite";

  if (!input.hasPreview) {
    return {
      canApply: false,
      buttonLabel: "Apply Import",
      blocker: null,
      requiresOverwriteConfirmation,
    };
  }

  const effectiveImportCount =
    input.duplicateStrategy === "skip"
      ? Math.max(input.validCount - input.duplicateCount, 0)
      : input.validCount;

  const buttonLabel =
    input.isLoading
      ? "Applying..."
      : input.duplicateCount > 0 && input.duplicateStrategy === "skip"
        ? effectiveImportCount > 0
          ? `Import ${effectiveImportCount}, skip ${countLabel(
              input.duplicateCount,
              "duplicate",
            )}`
          : "Import non-duplicates"
        : input.duplicateCount > 0 && input.duplicateStrategy === "rename"
          ? `Rename duplicates and import ${input.validCount}`
          : input.duplicateCount > 0 && input.duplicateStrategy === "overwrite"
            ? `Overwrite and import ${input.validCount}`
            : `Import ${countLabel(input.validCount, "skill")}`;

  let blocker: string | null = null;
  if (input.isLoading) {
    blocker = "Preview is still checking.";
  } else if (input.validationErrorCount > 0) {
    blocker = "Fix invalid skills before applying this import.";
  } else if (!input.previewOk) {
    blocker = "This preview cannot be applied yet.";
  } else if (input.validCount <= 0) {
    blocker = "Preview does not include any valid skills to import.";
  } else if (effectiveImportCount <= 0) {
    blocker =
      "All previewed skills are duplicates. Choose Rename or Overwrite to import changes.";
  } else if (requiresOverwriteConfirmation && !overwriteConfirmed) {
    blocker = "Type overwrite to confirm replacement.";
  }

  return {
    canApply: blocker === null,
    buttonLabel,
    blocker,
    requiresOverwriteConfirmation,
  };
}
