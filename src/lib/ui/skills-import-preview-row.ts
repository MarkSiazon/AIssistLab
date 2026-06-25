import { countLabel } from "@/lib/format/count-label";

type SkillsImportPreviewRowTone = "ok" | "warn" | "error";
type SkillsImportPreviewIssueTone = "warn" | "error";

interface SkillsImportPreviewRowIssueInput {
  message: string;
  category?: string;
}

export interface SkillsImportPreviewRowInput {
  displayName: string;
  duplicate: boolean;
  validationErrors: SkillsImportPreviewRowIssueInput[];
  qualityWarnings: SkillsImportPreviewRowIssueInput[];
  maxVisibleIssues?: number;
}

interface SkillsImportPreviewVisibleIssue {
  key: string;
  tone: SkillsImportPreviewIssueTone;
  message: string;
}

export interface SkillsImportPreviewRowState {
  statusLabel: "Ready" | "Duplicate" | "Warning" | "Invalid";
  statusTone: SkillsImportPreviewRowTone;
  issueSummary: string;
  ariaLabel: string;
  visibleIssues: SkillsImportPreviewVisibleIssue[];
  hiddenIssueCount: number;
  hiddenIssueMessage: string | null;
}

function warningMessage(warning: SkillsImportPreviewRowIssueInput): string {
  return warning.category
    ? `${warning.category}: ${warning.message}`
    : warning.message;
}

export function buildSkillsImportPreviewRowState(
  input: SkillsImportPreviewRowInput,
): SkillsImportPreviewRowState {
  const errorCount = input.validationErrors.length;
  const warningCount = input.qualityWarnings.length;
  const maxVisibleIssues = input.maxVisibleIssues ?? 3;
  const statusLabel: SkillsImportPreviewRowState["statusLabel"] =
    errorCount > 0
      ? "Invalid"
      : input.duplicate
        ? "Duplicate"
        : warningCount > 0
          ? "Warning"
          : "Ready";
  const statusTone: SkillsImportPreviewRowTone =
    statusLabel === "Invalid"
      ? "error"
      : statusLabel === "Ready"
        ? "ok"
        : "warn";

  const summaryParts: string[] = [];
  if (errorCount > 0) {
    summaryParts.push(countLabel(errorCount, "error"));
  }
  if (warningCount > 0) {
    summaryParts.push(countLabel(warningCount, "warning"));
  }
  if (input.duplicate) {
    summaryParts.push("duplicate");
  }

  const issueSummary =
    summaryParts.length === 1 && summaryParts[0] === "duplicate"
      ? "Duplicate skill"
      : summaryParts.length > 0
      ? summaryParts.join(", ")
      : statusLabel === "Ready"
        ? "Ready to import"
        : "Review before import";

  const errorIssues: SkillsImportPreviewVisibleIssue[] =
    input.validationErrors.map((error) => ({
      key: `error:${error.message}`,
      tone: "error" as const,
      message: error.message,
    }));
  const warningIssues: SkillsImportPreviewVisibleIssue[] =
    input.qualityWarnings.map((warning) => ({
      key: `warning:${warning.category ?? "general"}:${warning.message}`,
      tone: "warn" as const,
      message: warningMessage(warning),
    }));
  const allIssues: SkillsImportPreviewVisibleIssue[] = [
    ...errorIssues,
    ...warningIssues,
  ];
  const visibleIssues =
    errorIssues.length > 0 &&
    warningIssues.length > 0 &&
    maxVisibleIssues >= 2
      ? [
          ...errorIssues.slice(0, maxVisibleIssues - 1),
          warningIssues[0],
        ]
      : allIssues.slice(0, maxVisibleIssues);
  const hiddenIssueCount = Math.max(allIssues.length - visibleIssues.length, 0);

  return {
    statusLabel,
    statusTone,
    issueSummary,
    ariaLabel: `${input.displayName}: ${issueSummary.toLowerCase()}`,
    visibleIssues,
    hiddenIssueCount,
    hiddenIssueMessage:
      hiddenIssueCount > 0
        ? `${countLabel(
            hiddenIssueCount,
            "more issue",
            "more issues",
          )} hidden in this compact preview.`
        : null,
  };
}
