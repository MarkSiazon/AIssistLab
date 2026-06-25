import type { StatusSeverity } from "@/lib/status/status-types";

type GuidedHandoffStatus = "blocked" | "needs_review" | "needs_build" | "ready";
export type GuidedHandoffPrimaryAction = "review" | "build" | "open";

interface GuidedHandoffFeedbackCategory {
  status: StatusSeverity;
}

interface GuidedHandoffFeedback {
  score: number;
  categories: GuidedHandoffFeedbackCategory[];
}

export interface GuidedHandoffState {
  status: GuidedHandoffStatus;
  statusLabel: string;
  message: string;
  reviewDisabled: boolean;
  buildDisabled: boolean;
  openDisabled: boolean;
  primaryAction: GuidedHandoffPrimaryAction;
}

interface GuidedHandoffInput {
  requiredReady: boolean;
  loading: boolean;
  feedback: GuidedHandoffFeedback | null;
  draftReady: boolean;
}

function withLoadingDisabled(state: GuidedHandoffState, loading: boolean): GuidedHandoffState {
  if (!loading) return state;
  return {
    ...state,
    reviewDisabled: true,
    buildDisabled: true,
    openDisabled: true,
  };
}

export function buildGuidedHandoffState({
  requiredReady,
  loading,
  feedback,
  draftReady,
}: GuidedHandoffInput): GuidedHandoffState {
  if (!requiredReady) {
    return withLoadingDisabled(
      {
        status: "blocked",
        statusLabel: "Needs required details",
        message:
          "Complete the required readiness items before review, build, or editor handoff.",
        reviewDisabled: true,
        buildDisabled: true,
        openDisabled: true,
        primaryAction: "review",
      },
      loading,
    );
  }

  if (!feedback) {
    return withLoadingDisabled(
      {
        status: "needs_review",
        statusLabel: "Review needed",
        message: "Run rubric feedback before building the draft.",
        reviewDisabled: false,
        buildDisabled: true,
        openDisabled: true,
        primaryAction: "review",
      },
      loading,
    );
  }

  const hasError = feedback.categories.some((category) => category.status === "error");
  if (hasError) {
    return withLoadingDisabled(
      {
        status: "blocked",
        statusLabel: "Fix rubric errors",
        message:
          "Fix rubric errors before building or opening the draft in the editor.",
        reviewDisabled: false,
        buildDisabled: true,
        openDisabled: true,
        primaryAction: "review",
      },
      loading,
    );
  }

  if (!draftReady) {
    return withLoadingDisabled(
      {
        status: "needs_build",
        statusLabel: "Build preview",
        message:
          "Rubric has no errors. Build the draft so you can preview it before editing.",
        reviewDisabled: false,
        buildDisabled: false,
        openDisabled: true,
        primaryAction: "build",
      },
      loading,
    );
  }

  const hasWarning = feedback.categories.some((category) => category.status === "warn");
  return withLoadingDisabled(
    {
      status: "ready",
      statusLabel: hasWarning ? "Ready with warnings" : "Ready for editor",
      message: hasWarning
        ? "Draft preview is ready. You can improve warnings now or continue in the editor."
        : "Draft preview is ready for final validation and save in the editor.",
      reviewDisabled: false,
      buildDisabled: false,
      openDisabled: false,
      primaryAction: "open",
    },
    loading,
  );
}

export function guidedHandoffActionClass(
  action: GuidedHandoffPrimaryAction,
  state: GuidedHandoffState,
): string {
  return `ui-button ${
    state.primaryAction === action ? "ui-button-primary" : "ui-button-secondary"
  }`;
}
