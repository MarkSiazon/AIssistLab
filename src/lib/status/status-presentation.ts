import type {
  BlockingReadinessStatus,
  OptionalReadinessStatus,
  StatusSeverity,
  StatusTone,
} from "@/lib/status/status-types";

export function statusSeverityColor(status: StatusSeverity): string {
  if (status === "ok") return "var(--green)";
  if (status === "warn") return "var(--yellow)";
  return "var(--red)";
}

export function optionalReadinessColor(
  status: OptionalReadinessStatus,
): string {
  if (status === "ready") return "var(--green)";
  if (status === "optional") return "var(--text-muted)";
  return "var(--yellow)";
}

export function blockingReadinessColor(
  status: BlockingReadinessStatus,
): string {
  if (status === "ready") return "var(--green)";
  if (status === "blocked") return "var(--red)";
  return "var(--yellow)";
}

export function blockingReadinessLabel(
  status: BlockingReadinessStatus,
): "Ready" | "Needs action" | "Blocked" {
  if (status === "ready") return "Ready";
  if (status === "blocked") return "Blocked";
  return "Needs action";
}

export function blockingReadinessTone(
  status: BlockingReadinessStatus,
): StatusTone {
  if (status === "ready") return "ok";
  if (status === "blocked") return "error";
  return "warn";
}
