export function buildMockReleaseReadinessSection({
  id,
  label,
  status = "ready",
  message,
  actionLabel,
  actionHref,
}) {
  return {
    id,
    label,
    status,
    message,
    ...(actionLabel ? { actionLabel } : {}),
    ...(actionHref ? { actionHref } : {}),
  };
}

export function buildMockReleaseReadinessPayload({
  generatedAt = "2026-06-12T04:00:00.000Z",
  status = "ready",
  score = 100,
  topAction = null,
  canChat = true,
  canExportDiagnostics = true,
  sections,
}) {
  return {
    schemaVersion: 1,
    generatedAt,
    summary: {
      status,
      score,
      topAction,
      canChat,
      canExportDiagnostics,
    },
    sections,
  };
}
