import { countLabel } from "@/lib/format/count-label";
import { countSkillQualityIssues } from "@/lib/skills/quality";
import type {
  SkillLibraryQualityReport,
  SkillLibraryReadinessAction,
  SkillLibraryReadinessStatus,
} from "@/lib/skills/library-readiness";

export interface SkillQualitySummary {
  status: SkillLibraryReadinessStatus;
  label: string;
  message: string;
}

export function skillLibraryStatusColor(
  status: SkillLibraryReadinessStatus,
): string {
  if (status === "ready") return "var(--green)";
  if (status === "blocked") return "var(--red)";
  return "var(--yellow)";
}

export function skillLibraryReadinessActionHref(
  action: SkillLibraryReadinessAction,
): string | null {
  if (action === "guided-builder") return "/editor/guided";
  if (action === "create-skill") return "/editor";
  if (action === "review-quality") return "/settings";
  if (action === "export-skills") return "/export";
  return null;
}

export function buildSkillQualitySummary(
  qualityReport: SkillLibraryQualityReport | null | undefined,
): SkillQualitySummary {
  if (!qualityReport) {
    return {
      status: "needs_action",
      label: "Checking",
      message: "Skill Quality scan is still loading.",
    };
  }

  if (qualityReport.totalSkills === 0) {
    return {
      status: "needs_action",
      label: "No skills checked",
      message: "Create or import a skill before running quality checks.",
    };
  }

  const qualityCounts = countSkillQualityIssues(qualityReport.issues);

  if (qualityCounts.errorCount > 0) {
    return {
      status: "blocked",
      label: countLabel(qualityCounts.errorCount, "error"),
      message: "Skill Quality needs review before release.",
    };
  }

  if (qualityCounts.warningCount > 0) {
    return {
      status: "needs_action",
      label: countLabel(qualityCounts.warningCount, "warning"),
      message:
        "Skill Quality can be improved for better chat and export results.",
    };
  }

  return {
    status: "ready",
    label: "Clear",
    message: `Skill Quality checks are clear across ${countLabel(
      qualityReport.totalSkills,
      "skill",
    )}.`,
  };
}
