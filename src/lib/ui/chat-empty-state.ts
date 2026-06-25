import { APP_ROUTES } from "@/lib/routes/app-routes";

type ChatEmptyIndexStatus =
  | "ready"
  | "stale"
  | "missing"
  | "rebuilding"
  | "failed";

type ChatEmptyLinkActionId =
  | "settings"
  | "guided-builder"
  | "skills-library"
  | "export-diagnostics";
type ChatEmptyButtonActionId = "rebuild-index";

export interface ChatEmptyStateStatus {
  canSend: boolean;
  hasStatusError: boolean;
  indexStatus: ChatEmptyIndexStatus;
  indexSkillCount: number;
  suggestedQuestions: string[];
}

interface ChatEmptyActionBase {
  label: string;
  variant: "primary" | "secondary";
}

interface ChatEmptyLinkAction extends ChatEmptyActionBase {
  id: ChatEmptyLinkActionId;
  href: string;
}

interface ChatEmptyButtonAction extends ChatEmptyActionBase {
  id: ChatEmptyButtonActionId;
}

export type ChatEmptyAction = ChatEmptyLinkAction | ChatEmptyButtonAction;

export interface ChatReadinessActionVisibilityInput {
  canSend: boolean;
  indexStatus: ChatEmptyIndexStatus;
}

export interface ChatReadinessActionVisibility {
  showIndexAlert: boolean;
  showComposerIndexAction: boolean;
}

const DEFAULT_READY_SUGGESTIONS = [
  "What skills are indexed right now?",
  "Which skill should I use for this task?",
  "How can I improve this skill library?",
];

export function buildChatEmptySuggestions(
  status: ChatEmptyStateStatus,
): string[] {
  if (!status.canSend || status.hasStatusError || status.indexSkillCount <= 0) {
    return [];
  }

  if (status.suggestedQuestions.length > 0) {
    return status.suggestedQuestions.slice(0, 3);
  }

  if (status.indexStatus !== "ready") {
    return [];
  }

  return DEFAULT_READY_SUGGESTIONS;
}

export function buildChatEmptyActions(
  status: ChatEmptyStateStatus,
): ChatEmptyAction[] {
  if (!status.canSend || status.hasStatusError) {
    if (status.indexStatus === "failed") {
      return [
        {
          id: "settings",
          label: "Open Settings",
          href: APP_ROUTES.settings,
          variant: "primary",
        },
        {
          id: "rebuild-index",
          label: "Rebuild Index",
          variant: "secondary",
        },
        {
          id: "export-diagnostics",
          label: "Export Diagnostics",
          href: APP_ROUTES.exportDiagnostics,
          variant: "secondary",
        },
      ];
    }

    return [
      {
        id: "settings",
        label: "Open Settings",
        href: APP_ROUTES.settings,
        variant: "primary",
      },
      {
        id: "export-diagnostics",
        label: "Export Diagnostics",
        href: APP_ROUTES.exportDiagnostics,
        variant: "secondary",
      },
    ];
  }

  if (status.indexSkillCount <= 0) {
    return [
      {
        id: "guided-builder",
        label: "Guided Builder",
        href: APP_ROUTES.guidedBuilder,
        variant: "primary",
      },
      {
        id: "skills-library",
        label: "Open Skills",
        href: APP_ROUTES.skills,
        variant: "secondary",
      },
      {
        id: "export-diagnostics",
        label: "Export Diagnostics",
        href: APP_ROUTES.exportDiagnostics,
        variant: "secondary",
      },
    ];
  }

  if (status.indexStatus !== "ready") {
    return [
      {
        id: "rebuild-index",
        label:
          status.indexStatus === "rebuilding" ? "Rebuilding..." : "Rebuild Index",
        variant: "primary",
      },
      {
        id: "export-diagnostics",
        label: "Export Diagnostics",
        href: APP_ROUTES.exportDiagnostics,
        variant: "secondary",
      },
    ];
  }

  return [];
}

export function buildChatReadinessActionVisibility({
  canSend,
  indexStatus,
}: ChatReadinessActionVisibilityInput): ChatReadinessActionVisibility {
  const indexNeedsAction = indexStatus !== "ready";
  const indexFailureBlocksChat = indexStatus === "failed";
  const showIndexAction = indexNeedsAction && (canSend || indexFailureBlocksChat);

  return {
    showIndexAlert: showIndexAction,
    showComposerIndexAction: showIndexAction,
  };
}
