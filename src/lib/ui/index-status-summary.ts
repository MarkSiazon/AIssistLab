export type RagIndexStatus = "ready" | "stale" | "missing" | "rebuilding" | "failed";

export interface RagIndexStatusSnapshot {
  status: RagIndexStatus;
  skillCount: number;
  chunkCount: number;
  staleReason: string | null;
  error: string | null;
}

export function indexStatusLabel(status: RagIndexStatus): string {
  if (status === "ready") return "Ready";
  if (status === "stale") return "Stale";
  if (status === "missing") return "Missing";
  if (status === "rebuilding") return "Rebuilding";
  return "Failed";
}

export function indexStatusColor(status: RagIndexStatus): string {
  if (status === "ready") return "var(--green)";
  if (status === "failed") return "var(--red)";
  return "var(--yellow)";
}

export function indexStatusCountsLabel(indexStatus: RagIndexStatusSnapshot): string {
  const skillText = `${indexStatus.skillCount} skill${
    indexStatus.skillCount === 1 ? "" : "s"
  }`;
  const chunkText = `${indexStatus.chunkCount} chunk${
    indexStatus.chunkCount === 1 ? "" : "s"
  }`;
  const prefix =
    indexStatus.status === "stale"
      ? "Last index: "
      : indexStatus.status === "rebuilding"
        ? "Previous index: "
        : "";

  return `${prefix}${skillText} / ${chunkText}`;
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
