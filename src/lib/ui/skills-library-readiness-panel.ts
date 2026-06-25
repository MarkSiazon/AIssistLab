import { countLabel } from "@/lib/format/count-label";
import { APP_ROUTES } from "@/lib/routes/app-routes";
import { countSkillQualityIssues } from "@/lib/skills/quality";
import { blockingReadinessColor } from "@/lib/status/status-presentation";
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
  return blockingReadinessColor(status);
}

export function skillLibraryReadinessActionHref(
  action: SkillLibraryReadinessAction,
): string | null {
  if (action === "guided-builder") return APP_ROUTES.guidedBuilder;
  if (action === "create-skill") return APP_ROUTES.editor;
  if (action === "review-quality") return APP_ROUTES.settings;
  if (action === "export-skills") return APP_ROUTES.export;
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
