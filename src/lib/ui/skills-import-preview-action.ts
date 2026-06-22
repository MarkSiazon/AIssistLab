export type SkillsImportPreviewSourceType = "folder" | "archive" | "github";
export type SkillsImportPreviewReadinessTone =
  | "checking"
  | "ready"
  | "needs-action";

export interface SkillsImportPreviewActionInput {
  sourceType: SkillsImportPreviewSourceType;
  hasSource: boolean;
  isLoading: boolean;
  hasPreview: boolean;
}

export interface SkillsImportPreviewActionState {
  canPreview: boolean;
  buttonLabel: string;
  ariaLabel: string;
  readinessMessage: string;
  readinessTone: SkillsImportPreviewReadinessTone;
}

const sourceCopy: Record<
  SkillsImportPreviewSourceType,
  {
    buttonLabel: string;
    missingAriaLabel: string;
    readyAriaLabel: string;
    missingMessage: string;
  }
> = {
  folder: {
    buttonLabel: "Preview Folder",
    missingAriaLabel: "Enter a local folder path before previewing import",
    readyAriaLabel: "Preview local folder import without writing files",
    missingMessage: "Enter a local folder path before preview.",
  },
  archive: {
    buttonLabel: "Preview Zip",
    missingAriaLabel: "Choose a zip archive before previewing import",
    readyAriaLabel: "Preview zip archive import without writing files",
    missingMessage: "Choose a zip archive before preview.",
  },
  github: {
    buttonLabel: "Preview GitHub",
    missingAriaLabel: "Enter a public GitHub URL before previewing import",
    readyAriaLabel: "Preview GitHub import without writing files",
    missingMessage: "Enter a public GitHub URL before preview.",
  },
};

export function buildSkillsImportPreviewActionState(
  input: SkillsImportPreviewActionInput,
): SkillsImportPreviewActionState {
  if (input.isLoading) {
    return {
      canPreview: false,
      buttonLabel: "Checking...",
      ariaLabel: "Checking import source",
      readinessMessage: "Checking source. No files are being written.",
      readinessTone: "checking",
    };
  }

  const copy = sourceCopy[input.sourceType];
  const readinessMessage = input.hasPreview
    ? "Preview ready. Review results, duplicates, and warnings before applying."
    : input.hasSource
      ? "Ready to preview. No files will be written."
      : copy.missingMessage;

  return {
    canPreview: input.hasSource,
    buttonLabel: copy.buttonLabel,
    ariaLabel: input.hasSource ? copy.readyAriaLabel : copy.missingAriaLabel,
    readinessMessage,
    readinessTone: input.hasSource || input.hasPreview ? "ready" : "needs-action",
  };
}
