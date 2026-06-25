import { countLabel } from "@/lib/format/count-label";

export interface SkillEditorSaveActionInput {
  saving: boolean;
  fieldsReady: boolean;
  hasUnsavedChanges: boolean;
  validationErrorCount: number;
}

export interface SkillEditorSaveAction {
  canSave: boolean;
  buttonLabel: string;
  statusLabel: string;
  ariaLabel: string;
  helpText: string;
}

export function buildSkillEditorSaveAction(
  input: SkillEditorSaveActionInput,
): SkillEditorSaveAction {
  if (input.saving) {
    return {
      canSave: false,
      buttonLabel: "Saving...",
      statusLabel: "Saving",
      ariaLabel: "Saving skill",
      helpText: "Saving the skill file and marking the index stale.",
    };
  }

  if (!input.fieldsReady) {
    const issueCount = Math.max(input.validationErrorCount, 1);
    return {
      canSave: false,
      buttonLabel: issueCount === 1 ? "Fix field" : "Fix fields",
      statusLabel: issueCount === 1 ? "Needs field" : "Needs fields",
      ariaLabel: `Fix ${countLabel(issueCount, "validation issue")} before saving`,
      helpText: `Fix ${countLabel(issueCount, "validation issue")} before saving.`,
    };
  }

  if (!input.hasUnsavedChanges) {
    return {
      canSave: false,
      buttonLabel: "No changes",
      statusLabel: "Up to date",
      ariaLabel: "No unsaved changes to save",
      helpText: "The current editor values match the last saved version.",
    };
  }

  return {
    canSave: true,
    buttonLabel: "Save changes",
    statusLabel: "Ready to save",
    ariaLabel: "Save skill changes",
    helpText: "Save will write the skill file and mark the index stale.",
  };
}
