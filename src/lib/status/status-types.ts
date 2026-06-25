export type StatusSeverity = "ok" | "warn" | "error";
export type StatusTone = StatusSeverity | "neutral";
export type IssueStatusSeverity = Extract<StatusSeverity, "warn" | "error">;
export type OptionalReadinessStatus = "ready" | "needs_action" | "optional";
export type BlockingReadinessStatus = "ready" | "needs_action" | "blocked";
