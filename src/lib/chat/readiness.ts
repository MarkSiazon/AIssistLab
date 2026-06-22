import type { PublicIndexState } from "@/lib/rag/index-state";

export interface ChatReadinessInput {
  provider: "anthropic_api" | "claude_code_cli";
  claudeCliEnabled: boolean;
  index: PublicIndexState;
  apiKey: string | undefined;
}

export interface ChatReadiness {
  canSend: boolean;
  blockingReason: string | null;
  suggestedAction: string | null;
}

function isPlaceholderApiKey(value: string | undefined): boolean {
  const trimmed = value?.trim();
  return !trimmed || trimmed === "your-api-key-here";
}

export function getChatReadiness({
  provider,
  claudeCliEnabled,
  index,
  apiKey,
}: ChatReadinessInput): ChatReadiness {
  if (provider === "anthropic_api" && isPlaceholderApiKey(apiKey)) {
    return {
      canSend: false,
      blockingReason: "ANTHROPIC_API_KEY is not configured.",
      suggestedAction:
        "Add a valid ANTHROPIC_API_KEY in Settings, or switch to Local Claude CLI mode.",
    };
  }

  if (provider === "claude_code_cli" && !claudeCliEnabled) {
    return {
      canSend: false,
      blockingReason: "Local Claude CLI mode is disabled.",
      suggestedAction:
        "Set ENABLE_LOCAL_CLAUDE_CLI=true in Settings before using local CLI mode.",
    };
  }

  if (index.status === "failed") {
    return {
      canSend: false,
      blockingReason: "The RAG index failed to build.",
      suggestedAction:
        "Fix workspace or skills path issues, then use Rebuild Index.",
    };
  }

  if (index.status === "missing") {
    return {
      canSend: true,
      blockingReason: null,
      suggestedAction: "Rebuild Index before relying on citations.",
    };
  }

  if (index.status === "stale") {
    return {
      canSend: true,
      blockingReason: null,
      suggestedAction: "Rebuild Index to refresh citations.",
    };
  }

  if (index.status === "rebuilding") {
    return {
      canSend: true,
      blockingReason: null,
      suggestedAction: "Wait for Rebuild Index to finish before relying on citations.",
    };
  }

  return {
    canSend: true,
    blockingReason: null,
    suggestedAction: null,
  };
}
