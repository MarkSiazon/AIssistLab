import { countLabel } from "@/lib/format/count-label";
import type { RagIndexStateStatus } from "@/lib/rag/index-state-types";

export type RagIndexStatus = RagIndexStateStatus;

export interface RagIndexStatusSnapshot {
  status: RagIndexStatus;
  skillCount: number;
  chunkCount: number;
  staleReason: string | null;
  error: string | null;
}

interface RagIndexCounts {
  skillCount: number;
  chunkCount: number;
}

export function indexStatusLabel(status: RagIndexStatus): string {
  if (status === "ready") return "Ready";
  if (status === "stale") return "Stale";
  if (status === "missing") return "Missing";
  if (status === "rebuilding") return "Rebuilding";
  return "Failed";
}

export function indexStatusTitle(status: RagIndexStatus): string {
  return `Index ${indexStatusLabel(status).toLowerCase()}`;
}

export function indexStatusColor(status: RagIndexStatus): string {
  if (status === "ready") return "var(--green)";
  if (status === "failed") return "var(--red)";
  return "var(--yellow)";
}

export function indexCountsLabel(indexStatus: RagIndexCounts): string {
  const skillText = countLabel(indexStatus.skillCount, "skill");
  const chunkText = countLabel(indexStatus.chunkCount, "chunk");
  return `${skillText} / ${chunkText}`;
}

export function indexStatusCountsLabel(indexStatus: RagIndexStatusSnapshot): string {
  const prefix =
    indexStatus.status === "stale"
      ? "Last index: "
      : indexStatus.status === "rebuilding"
        ? "Previous index: "
        : "";

  return `${prefix}${indexCountsLabel(indexStatus)}`;
}

export function indexRebuiltMessage(indexStatus: RagIndexCounts): string {
  return `Index rebuilt with ${countLabel(
    indexStatus.skillCount,
    "skill",
  )} and ${countLabel(indexStatus.chunkCount, "chunk")}.`;
}

export function indexStatusUpdateMessage(
  indexStatus: RagIndexStatusSnapshot,
): string {
  return `Index ${indexStatus.status}: ${countLabel(
    indexStatus.skillCount,
    "skill",
  )}, ${countLabel(indexStatus.chunkCount, "chunk")}.`;
}

export function indexSuggestedAction(
  indexStatus: Pick<RagIndexStatusSnapshot, "status">,
): string {
  if (indexStatus.status === "failed") return "Fix the index error, then rebuild.";
  if (indexStatus.status === "rebuilding") return "Wait for rebuild to finish.";
  return "Rebuild Index before relying on citations.";
}

export function indexStatusAnnouncement(
  indexStatus: RagIndexStatusSnapshot | null,
  indexLoading: boolean,
  indexError: string | null,
): string {
  if (!indexStatus) {
    if (indexLoading) return "RAG index status: checking index.";
    return indexError
      ? `RAG index status unavailable. ${indexError}`
      : "RAG index status unavailable.";
  }

  const label = indexStatusLabel(indexStatus.status);
  const visualCounts = indexStatusCountsLabel(indexStatus);
  const counts =
    indexStatus.status === "stale"
      ? visualCounts.replace("Last index: ", "Last index had ").replace(" / ", ", ")
      : visualCounts.replace(" / ", ", ");
  const reason = indexStatus.staleReason ?? indexStatus.error;

  return [
    `RAG index status: ${label}.`,
    `${counts}.`,
    reason ? `Note: ${reason}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}
