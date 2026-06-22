import type { ClaudeProjectInventory } from "@/lib/claude/project-inventory";
import type { ChatReadiness } from "@/lib/chat/readiness";
import type { PublicIndexState } from "@/lib/rag/index-state";
import type { SetupDoctorCheck } from "@/lib/settings/doctor";
import type { SkillQualityReport } from "@/lib/skills/quality";
import type {
  ReleaseReadinessSection,
  ReleaseReadinessStatus,
} from "@/lib/release/readiness-types";

export function groupChecks(
  checks: SetupDoctorCheck[],
  groups: SetupDoctorCheck["group"][],
): SetupDoctorCheck[] {
  return checks.filter((check) => groups.includes(check.group));
}

export function statusFromChecks(
  checks: SetupDoctorCheck[],
): ReleaseReadinessStatus {
  if (checks.some((check) => check.status === "error")) return "blocked";
  if (checks.some((check) => check.status === "warn")) return "needs_action";
  return "ready";
}

export function firstProblemMessage(
  checks: SetupDoctorCheck[],
  fallback: string,
): string {
  const problem = checks.find((check) => check.status !== "ok");
  return problem?.suggestedFix ?? problem?.message ?? fallback;
}

export function indexStatus(index: PublicIndexState): ReleaseReadinessStatus {
  if (index.status === "failed") return "blocked";
  if (index.status !== "ready") return "needs_action";
  if (index.skillCount === 0) return "needs_action";
  return "ready";
}

export function skillsStatus(
  report: SkillQualityReport,
): ReleaseReadinessStatus {
  return report.issueCount > 0 ? "needs_action" : "ready";
}

export function claudeProjectStatus(
  inventory: ClaudeProjectInventory | null,
): ReleaseReadinessStatus {
  if (!inventory) return "needs_action";
  return inventory.checks.some((check) => check.status !== "ok")
    ? "needs_action"
    : "ready";
}

export function chatStatus(chat: ChatReadiness): ReleaseReadinessStatus {
  if (!chat.canSend) return "blocked";
  if (chat.suggestedAction) return "needs_action";
  return "ready";
}

export function summarizeStatus(
  sections: ReleaseReadinessSection[],
): ReleaseReadinessStatus {
  const functionalSections = sections.filter(
    (item) => item.id !== "diagnostics",
  );
  if (functionalSections.some((item) => item.status === "blocked")) {
    return "blocked";
  }
  if (functionalSections.some((item) => item.status === "needs_action")) {
    return "needs_action";
  }
  return "ready";
}

export function scoreSections(
  sections: ReleaseReadinessSection[],
  doctorScore: number,
): number {
  const penalty = sections.reduce((total, item) => {
    if (item.id === "diagnostics") return total;
    if (item.status === "blocked") return total + 20;
    if (item.status === "needs_action") return total + 8;
    return total;
  }, 0);
  return Math.max(0, Math.min(100, doctorScore - penalty));
}
