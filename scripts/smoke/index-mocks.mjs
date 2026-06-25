export function buildMockIndexStatusPayload({
  status = "ready",
  built = status === "ready",
  builtAt = built ? "2026-06-12T04:00:00.000Z" : null,
  skillCount = 1,
  chunkCount = 2,
  staleReason = null,
  workspaceDisplay = "./examples/demo-workspace",
  skillsDirDisplay = ".claude/skills",
  error = null,
} = {}) {
  return {
    status,
    built,
    builtAt,
    skillCount,
    chunkCount,
    staleReason,
    workspaceDisplay,
    skillsDirDisplay,
    error,
  };
}
