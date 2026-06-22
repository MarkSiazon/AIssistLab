export type SkillLibraryReadinessStatus = "ready" | "needs_action" | "blocked";
export type SkillLibraryReadinessAction =
  | "guided-builder"
  | "create-skill"
  | "rebuild-index"
  | "review-quality"
  | "export-skills"
  | "refresh";

export interface SkillLibraryIndexState {
  status: "ready" | "stale" | "missing" | "rebuilding" | "failed";
  skillCount: number;
  chunkCount: number;
  staleReason?: string | null;
  error?: string | null;
}

export interface SkillLibraryQualityIssue {
  skillName: string;
  severity: "warn" | "error";
  category: string;
  message: string;
}

export interface SkillLibraryQualityReport {
  totalSkills: number;
  issueCount: number;
  issues: SkillLibraryQualityIssue[];
}

export interface SkillLibraryReadinessInput {
  totalSkills: number | null;
  skillsStatus?: "loading" | "ready" | "error";
  skillsError?: string | null;
  indexStatus: SkillLibraryIndexState | null;
  qualityReport: SkillLibraryQualityReport | null;
}

export interface SkillLibraryReadiness {
  status: SkillLibraryReadinessStatus;
  statusLabel: "Ready" | "Needs action" | "Blocked";
  message: string;
  action: SkillLibraryReadinessAction;
  actionLabel: string;
  indexedSkillCount: number;
  chunkCount: number;
  issueCount: number;
  errorCount: number;
  warningCount: number;
}

function statusLabel(
  status: SkillLibraryReadinessStatus,
): SkillLibraryReadiness["statusLabel"] {
  if (status === "ready") return "Ready";
  if (status === "blocked") return "Blocked";
  return "Needs action";
}

function readiness(
  input: Omit<SkillLibraryReadiness, "statusLabel">,
): SkillLibraryReadiness {
  return { ...input, statusLabel: statusLabel(input.status) };
}

export function buildSkillLibraryReadiness(
  input: SkillLibraryReadinessInput,
): SkillLibraryReadiness {
  const skillsStatus =
    input.skillsStatus ?? (typeof input.totalSkills === "number" ? "ready" : "loading");
  const issues = input.qualityReport?.issues ?? [];
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warn").length;
  const indexedSkillCount = input.indexStatus?.skillCount ?? 0;
  const chunkCount = input.indexStatus?.chunkCount ?? 0;

  const baseCounts = {
    indexedSkillCount,
    chunkCount,
    issueCount: input.qualityReport?.issueCount ?? issues.length,
    errorCount,
    warningCount,
  };

  if (skillsStatus === "loading") {
    return readiness({
      ...baseCounts,
      status: "needs_action",
      message: "Skill library status is still loading.",
      action: "refresh",
      actionLabel: "Refresh",
    });
  }

  if (skillsStatus === "error") {
    return readiness({
      ...baseCounts,
      status: "blocked",
      message:
        input.skillsError ??
        "Skill library could not be loaded. Check workspace and skills path settings.",
      action: "refresh",
      actionLabel: "Refresh",
    });
  }

  if (input.totalSkills === 0) {
    return readiness({
      ...baseCounts,
      indexedSkillCount: 0,
      chunkCount: 0,
      status: "blocked",
      message: "No skills are available yet. Create or import a skill before using chat.",
      action: "guided-builder",
      actionLabel: "Guided Builder",
    });
  }

  if (!input.indexStatus) {
    return readiness({
      ...baseCounts,
      status: "needs_action",
      message: "Index status is still loading. Recheck or rebuild before relying on chat.",
      action: "rebuild-index",
      actionLabel: "Rebuild Index",
    });
  }

  if (input.indexStatus.status === "rebuilding") {
    return readiness({
      ...baseCounts,
      status: "needs_action",
      message: "The RAG index is rebuilding.",
      action: "rebuild-index",
      actionLabel: "Rebuilding...",
    });
  }

  if (input.indexStatus.status === "failed") {
    return readiness({
      ...baseCounts,
      status: "blocked",
      message:
        input.indexStatus.error ??
        "The RAG index failed to build. Fix the index error before chat.",
      action: "rebuild-index",
      actionLabel: "Rebuild Index",
    });
  }

  if (
    input.indexStatus.status !== "ready" ||
    input.indexStatus.skillCount === 0
  ) {
    return readiness({
      ...baseCounts,
      status: "needs_action",
      message:
        input.indexStatus.staleReason ??
        "Rebuild the index so chat can use the latest skills.",
      action: "rebuild-index",
      actionLabel: "Rebuild Index",
    });
  }

  if (!input.qualityReport) {
    return readiness({
      ...baseCounts,
      status: "needs_action",
      message: "Skill quality status is still loading.",
      action: "review-quality",
      actionLabel: "Review Quality",
    });
  }

  if (errorCount > 0) {
    return readiness({
      ...baseCounts,
      status: "blocked",
      message: `${errorCount} skill quality error${errorCount === 1 ? "" : "s"} need review before release.`,
      action: "review-quality",
      actionLabel: "Review Quality",
    });
  }

  if (warningCount > 0) {
    return readiness({
      ...baseCounts,
      status: "needs_action",
      message: `${warningCount} skill quality warning${warningCount === 1 ? "" : "s"} can improve chat and export quality.`,
      action: "review-quality",
      actionLabel: "Review Quality",
    });
  }

  return readiness({
    ...baseCounts,
    status: "ready",
    message: "Skills are indexed and quality checks are clear.",
    action: "export-skills",
    actionLabel: "Export Skills",
  });
}
