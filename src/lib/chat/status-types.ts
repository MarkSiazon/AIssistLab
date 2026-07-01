import type { ClaudeCliTestResult } from "@/lib/rag/claude-cli-test-state";
import type { PublicIndexState } from "@/lib/rag/index-state-types";
import type {
  LlmProvider,
  RuntimeProviderSource,
} from "@/lib/rag/llm-types";
import type { ReleaseReadinessStatus } from "@/lib/release/readiness-types";

export type ChatProvider = LlmProvider;
export type ChatRuntimeSource = RuntimeProviderSource;

export interface ChatReadinessStatus {
  provider: ChatProvider;
  runtimeSource: ChatRuntimeSource;
  canSend: boolean;
  blockingReason: string | null;
  suggestedAction: string | null;
  index: Pick<
    PublicIndexState,
    "status" | "skillCount" | "chunkCount" | "staleReason" | "error"
  >;
  lastCliSmokeTest: ClaudeCliTestResult | null;
}

export interface ChatReadinessReleaseSummary {
  status?: ReleaseReadinessStatus;
  topAction?: string | null;
  topActionLabel?: string | null;
  topActionHref?: string | null;
}
