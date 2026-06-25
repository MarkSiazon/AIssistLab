import {
  indexCountsLabel,
  indexSuggestedAction,
  indexStatusTitle,
} from "@/lib/ui/index-status-summary";
import type {
  ChatProvider,
  ChatReadinessReleaseSummary,
  ChatReadinessStatus,
  ChatRuntimeSource,
} from "@/lib/chat/status-types";
import type { ReleaseReadinessStatus } from "@/lib/release/readiness-types";
import type { UiTone } from "@/lib/ui/tone";

export type ChatStatusTone = UiTone;
export type { ChatReadinessReleaseSummary, ChatReadinessStatus };

export interface ChatStatusChip {
  label: string;
  tone: ChatStatusTone;
}

export interface ChatReadinessRow {
  label: string;
  value: string;
  detail: string | null;
  tone: ChatStatusTone;
}

export interface ChatEmptyStateCopy {
  title: string;
  message: string;
}

function providerLabel(provider: ChatProvider): string {
  return provider === "claude_code_cli" ? "Claude CLI" : "Anthropic API";
}

function runtimeLabel(source: ChatRuntimeSource): string {
  return source === "runtime" ? "Applied session" : "Process env";
}

function smokeTestLabel(status: ChatReadinessStatus): string {
  if (status.provider !== "claude_code_cli") return "CLI test not needed";
  if (!status.lastCliSmokeTest?.checked) return "CLI test not run";
  if (status.lastCliSmokeTest.ok) return "CLI test passed";
  return "CLI test failed";
}

function authReadinessLabel(status: ChatReadinessStatus): string {
  if (status.provider === "claude_code_cli") return smokeTestLabel(status);
  return status.canSend ? "API key ready" : "API key needs setup";
}

function releaseReadinessLabel(
  status: ReleaseReadinessStatus | undefined,
): string {
  if (status === "ready") return "Release ready";
  if (status === "needs_action") return "Release needs action";
  if (status === "blocked") return "Release blocked";
  return "Release not checked";
}

function chatStatusTone(
  status: ChatReadinessStatus,
  label: string,
): ChatStatusTone {
  if (label === "Ready to send") return "ok";
  if (label === "Chat blocked") return "error";
  if (label.startsWith("Index ready")) return "ok";
  if (label.startsWith("Index failed")) return "error";
  if (label.startsWith("Index ")) return "warn";
  if (label === "CLI test passed") return "ok";
  if (label === "CLI test failed") return "error";
  if (label === "CLI test not run") return "warn";
  if (!status.canSend && label === providerLabel(status.provider)) return "warn";
  return "neutral";
}

export function buildChatStatusChips(
  status: ChatReadinessStatus | null,
): ChatStatusChip[] {
  if (!status) return [];

  return [
    status.canSend ? "Ready to send" : "Chat blocked",
    providerLabel(status.provider),
    runtimeLabel(status.runtimeSource),
    indexStatusTitle(status.index.status),
    authReadinessLabel(status),
  ].map((label) => ({
    label,
    tone: chatStatusTone(status, label),
  }));
}

export function buildChatReadinessRows({
  status,
  release,
}: {
  status: ChatReadinessStatus | null;
  release: ChatReadinessReleaseSummary | null;
}): ChatReadinessRow[] {
  if (!status) return [];

  const authLabel = authReadinessLabel(status);

  return [
    {
      label: "Chat",
      value: status.canSend ? "Ready to send" : "Blocked",
      detail:
        !status.canSend && status.blockingReason
          ? status.blockingReason
          : release?.topAction ?? "No blocking chat issue.",
      tone: status.canSend ? "ok" : "error",
    },
    {
      label: "Provider",
      value: providerLabel(status.provider),
      detail: runtimeLabel(status.runtimeSource),
      tone: status.canSend ? "neutral" : "warn",
    },
    {
      label: "Index",
      value: indexStatusTitle(status.index.status),
      detail: indexCountsLabel(status.index),
      tone:
        status.index.status === "ready"
          ? "ok"
          : status.index.status === "failed"
            ? "error"
            : "warn",
    },
    {
      label: status.provider === "claude_code_cli" ? "CLI test" : "API auth",
      value: authLabel,
      detail:
        status.provider === "claude_code_cli" &&
        status.lastCliSmokeTest?.error
          ? status.lastCliSmokeTest.error
          : releaseReadinessLabel(release?.status),
      tone:
        authLabel.includes("passed") || authLabel.includes("ready")
          ? "ok"
          : authLabel.includes("failed") || authLabel.includes("needs")
            ? "error"
            : "warn",
    },
  ];
}

export function buildChatEmptyStateCopy({
  status,
  statusPending,
  statusError,
  indexNeedsAction,
}: {
  status: ChatReadinessStatus | null;
  statusPending: boolean;
  statusError: string | null;
  indexNeedsAction: boolean;
}): ChatEmptyStateCopy {
  if (statusPending) {
    return {
      title: "Checking chat readiness",
      message:
        "Loading provider, auth, and index state before enabling the first message.",
    };
  }

  if (statusError) {
    return {
      title: "Chat readiness unavailable",
      message: `${statusError}. Open Settings or export diagnostics if this persists.`,
    };
  }

  if (status?.canSend === false) {
    return {
      title: "Chat needs setup before first message",
      message:
        status.suggestedAction ||
        status.blockingReason ||
        "Resolve provider readiness before sending a message.",
    };
  }

  if (indexNeedsAction && status) {
    return {
      title: "Rebuild the index before relying on answers",
      message:
        status.index.staleReason ||
        status.index.error ||
        indexSuggestedAction(status.index),
    };
  }

  return {
    title: "Ask about your skills",
    message:
      "Use the current skill library as the source of truth. Answers include citations when the index has matching context.",
  };
}
