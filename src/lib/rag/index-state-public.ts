import { sanitizeError } from "@/lib/rag/index-state-display";
import type {
  CurrentIndexConfig,
  PersistedIndexState,
  PublicIndexState,
} from "@/lib/rag/index-state-types";

export function toPublicIndexState(
  state: PersistedIndexState | null,
  config: CurrentIndexConfig,
): PublicIndexState {
  if (!state) {
    return {
      status: "missing",
      built: false,
      builtAt: null,
      skillCount: 0,
      chunkCount: 0,
      staleReason: "The RAG index has not been built.",
      workspaceDisplay: config.workspaceDisplay,
      skillsDirDisplay: config.skillsDirDisplay,
      error: null,
    };
  }

  const configChanged =
    state.workspaceFingerprint !== config.workspaceFingerprint ||
    state.skillsDirFingerprint !== config.skillsDirFingerprint;
  const filesChanged =
    state.skillFilesFingerprint !== config.skillFilesFingerprint;
  const derivedStaleReason = configChanged
    ? "Workspace or skills path changed after the last index build."
    : filesChanged
      ? "Skill files changed after the last index build."
      : null;
  const status =
    state.status === "ready" && derivedStaleReason ? "stale" : state.status;

  return {
    status,
    built: status === "ready",
    builtAt: state.builtAt,
    skillCount: state.skillCount,
    chunkCount: state.chunkCount,
    staleReason:
      status === "stale"
        ? state.staleReason ?? derivedStaleReason
        : state.staleReason,
    workspaceDisplay: config.workspaceDisplay,
    skillsDirDisplay: config.skillsDirDisplay,
    error: state.error ? sanitizeError(state.error) : null,
  };
}
