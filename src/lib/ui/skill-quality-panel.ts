import type {
  SkillQualityIssue,
  SkillQualityReport,
} from "@/lib/skills/quality";

interface SkillQualityIssueItem {
  key: string;
  skillName: string;
  categoryLabel: string;
  severity: SkillQualityIssue["severity"];
  message: string;
}

export interface SkillQualityPanelState {
  statusColor: string;
  statusLabel: string;
  scannedLabel: string;
  issues: SkillQualityIssueItem[];
}

function hasErrorIssue(report: SkillQualityReport): boolean {
  return report.issues.some((issue) => issue.severity === "error");
}

function issueCountLabel(issueCount: number): string {
  if (issueCount === 0) return "No issues";
  return `${issueCount} issue${issueCount === 1 ? "" : "s"}`;
}

function scannedLabel(totalSkills: number): string {
  return `${totalSkills} skill${totalSkills === 1 ? "" : "s"} scanned`;
}

export function getSkillQualityPanelState(
  report: SkillQualityReport,
): SkillQualityPanelState {
  return {
    statusColor:
      report.issueCount === 0
        ? "var(--green)"
        : hasErrorIssue(report)
          ? "var(--red)"
          : "var(--yellow)",
    statusLabel: issueCountLabel(report.issueCount),
    scannedLabel: scannedLabel(report.totalSkills),
    issues: report.issues.slice(0, 3).map((issue) => ({
      key: `${issue.skillName}-${issue.code}`,
      skillName: issue.skillName,
      categoryLabel: issue.category.replace(/_/g, " "),
      severity: issue.severity,
      message: issue.message,
    })),
  };
}
