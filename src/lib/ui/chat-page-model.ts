import {
  buildChatEmptyActions,
  buildChatEmptySuggestions,
  buildChatReadinessActionVisibility,
  type ChatEmptyAction,
  type ChatEmptyStateStatus,
  type ChatReadinessActionVisibility,
} from "@/lib/ui/chat-empty-state";
import {
  buildChatEmptyStateCopy,
  buildChatReadinessRows,
  buildChatStatusChips,
  type ChatEmptyStateCopy,
  type ChatReadinessReleaseSummary,
  type ChatReadinessRow,
  type ChatReadinessStatus,
  type ChatStatusChip,
  type ChatStatusTone,
} from "@/lib/ui/chat-readiness-panel";
import { indexSuggestedAction } from "@/lib/ui/index-status-summary";
import {
  buildChatComposerActionState,
  type ChatComposerActionState,
} from "@/lib/ui/chat-composer-action";

export interface ChatPageStatus extends ChatReadinessStatus {
  suggestedQuestions: string[];
}

export interface ChatPageModelInput {
  status: ChatPageStatus | null;
  statusError: string | null;
  releaseSummary: ChatReadinessReleaseSummary | null;
  inputValue: string;
  streaming: boolean;
}

export interface ChatPageModel {
  actionVisibility: ChatReadinessActionVisibility;
  chatStatusPending: boolean;
  composerAction: ChatComposerActionState;
  composerHelp: string;
  composerPlaceholder: string;
  composerStatusDetail: string;
  composerStatusTitle: string;
  composerStatusTone: ChatStatusTone;
  emptyActions: ChatEmptyAction[];
  emptyStateCopy: ChatEmptyStateCopy;
  emptySuggestions: string[];
  indexNeedsAction: boolean;
  inputLocked: boolean;
  readinessRows: ChatReadinessRow[];
  sendBlocked: boolean;
  sendDisabled: boolean;
  statusChips: ChatStatusChip[];
}

function buildChatEmptyStateStatus({
  status,
  statusError,
}: {
  status: ChatPageStatus | null;
  statusError: string | null;
}): ChatEmptyStateStatus | null {
  if (status) {
    return {
      canSend: status.canSend,
      hasStatusError: false,
      indexStatus: status.index.status,
      indexSkillCount: status.index.skillCount,
      suggestedQuestions: status.suggestedQuestions,
    };
  }

  if (statusError) {
    return {
      canSend: false,
      hasStatusError: true,
      indexStatus: "missing",
      indexSkillCount: 0,
      suggestedQuestions: [],
    };
  }

  return null;
}

function composerStatusTitle(input: {
  sendBlocked: boolean;
  statusError: string | null;
  statusPending: boolean;
  indexNeedsAction: boolean;
}): string {
  if (input.sendBlocked) return "Chat is blocked";
  if (input.statusError) return "Readiness unavailable";
  if (input.statusPending) return "Checking readiness";
  if (input.indexNeedsAction) return "Index needs attention";
  return "Ready to send";
}

function composerStatusDetail(input: {
  status: ChatPageStatus | null;
  sendBlocked: boolean;
  statusError: string | null;
  statusPending: boolean;
  indexNeedsAction: boolean;
}): string {
  if (input.sendBlocked) {
    return input.status?.blockingReason ?? "Resolve setup before sending.";
  }
  if (input.statusPending) {
    return "Checking local provider, auth, and index readiness.";
  }
  if (input.statusError) {
    return "Open Settings or export diagnostics if this persists.";
  }
  if (input.indexNeedsAction && input.status) {
    return (
      input.status.index.staleReason ||
      input.status.index.error ||
      indexSuggestedAction(input.status.index)
    );
  }
  return "Nothing is sent until you press Send. The provider receives your prompt plus retrieved skill excerpts.";
}

function composerPlaceholder(input: {
  sendBlocked: boolean;
  statusError: string | null;
  statusPending: boolean;
}): string {
  if (input.statusPending) return "Checking chat readiness...";
  if (input.statusError) return "Chat readiness is unavailable";
  if (input.sendBlocked) {
    return "Chat is blocked until provider settings are ready";
  }
  return "Ask about your skills...";
}

function composerHelp({
  composerAction,
  indexNeedsAction,
}: {
  composerAction: ChatComposerActionState;
  indexNeedsAction: boolean;
}): string {
  if (composerAction.disabledReason) return composerAction.disabledReason;
  if (indexNeedsAction) {
    return "You can send anyway. It will use the last available index context, so rebuild before relying on citations.";
  }
  return "Ready. Press Enter to send. The provider receives your prompt plus retrieved skill excerpts and citation metadata.";
}

export function buildChatPageModel({
  status,
  statusError,
  releaseSummary,
  inputValue,
  streaming,
}: ChatPageModelInput): ChatPageModel {
  const sendBlocked = status?.canSend === false;
  const chatStatusPending = !status && !statusError;
  const sendUnavailable = !status || Boolean(statusError);
  const inputLocked = sendBlocked || sendUnavailable;
  const indexNeedsAction = Boolean(status && status.index.status !== "ready");
  const composerAction = buildChatComposerActionState({
    inputValue,
    streaming,
    statusPending: chatStatusPending,
    statusError: Boolean(statusError),
    sendBlocked,
    indexNeedsAction,
  });
  const actionVisibility = status
    ? buildChatReadinessActionVisibility({
        canSend: status.canSend,
        indexStatus: status.index.status,
      })
    : {
        showIndexAlert: false,
        showComposerIndexAction: false,
      };
  const emptyStateStatus = buildChatEmptyStateStatus({ status, statusError });

  return {
    actionVisibility,
    chatStatusPending,
    composerAction,
    composerHelp: composerHelp({ composerAction, indexNeedsAction }),
    composerPlaceholder: composerPlaceholder({
      sendBlocked,
      statusError,
      statusPending: chatStatusPending,
    }),
    composerStatusDetail: composerStatusDetail({
      status,
      sendBlocked,
      statusError,
      statusPending: chatStatusPending,
      indexNeedsAction,
    }),
    composerStatusTitle: composerStatusTitle({
      sendBlocked,
      statusError,
      statusPending: chatStatusPending,
      indexNeedsAction,
    }),
    composerStatusTone:
      sendBlocked || statusError
        ? "error"
        : chatStatusPending || indexNeedsAction
          ? "warn"
          : "ok",
    emptyActions: emptyStateStatus
      ? buildChatEmptyActions(emptyStateStatus)
      : [],
    emptyStateCopy: buildChatEmptyStateCopy({
      status,
      statusPending: chatStatusPending,
      statusError,
      indexNeedsAction,
    }),
    emptySuggestions: emptyStateStatus
      ? buildChatEmptySuggestions(emptyStateStatus)
      : [],
    indexNeedsAction,
    inputLocked,
    readinessRows: buildChatReadinessRows({
      status,
      release: releaseSummary,
    }),
    sendBlocked,
    sendDisabled: composerAction.disabled,
    statusChips: buildChatStatusChips(status),
  };
}
