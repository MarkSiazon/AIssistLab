import Link from "next/link";
import { APP_ROUTES } from "@/lib/routes/app-routes";
import type { ChatPageStatus } from "@/lib/ui/chat-page-model";
import { indexSuggestedAction } from "@/lib/ui/index-status-summary";

interface ChatBlockedAlertProps {
  status: ChatPageStatus | null;
  releaseTopAction: string | null | undefined;
}

interface ChatIndexAlertProps {
  status: ChatPageStatus | null;
  rebuilding: boolean;
  show: boolean;
  onRebuildIndex: () => void;
}

export function ChatBlockedAlert({
  status,
  releaseTopAction,
}: ChatBlockedAlertProps) {
  if (!status || status.canSend) return null;

  return (
    <div
      className="chat-alert chat-alert-error border-b"
      role="status"
      aria-live="polite"
      style={{ borderColor: "var(--border)" }}
    >
      <span className="text-xs font-medium" style={{ color: "var(--red)" }}>
        Chat is blocked: {status.blockingReason}
      </span>
      {status.suggestedAction && (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {status.suggestedAction}
        </span>
      )}
      {releaseTopAction && (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Release readiness: {releaseTopAction}
        </span>
      )}
      <div className="chat-alert-actions">
        <Link
          href={APP_ROUTES.settings}
          className="ui-button ui-button-secondary chat-danger-action text-xs"
        >
          Open Settings
        </Link>
        <Link
          href={APP_ROUTES.exportDiagnostics}
          className="ui-button ui-button-secondary text-xs"
        >
          Export Diagnostics
        </Link>
      </div>
    </div>
  );
}

export function ChatIndexAlert({
  status,
  rebuilding,
  show,
  onRebuildIndex,
}: ChatIndexAlertProps) {
  if (!status || !show) return null;

  return (
    <div
      className="chat-alert chat-alert-warning chat-index-alert border-b"
      style={{ borderColor: "var(--border)" }}
    >
      <span className="text-xs" style={{ color: "var(--yellow)" }}>
        Index {status.index.status}:{" "}
        {status.index.staleReason ||
          status.index.error ||
          indexSuggestedAction(status.index)}
      </span>
      <button
        type="button"
        onClick={onRebuildIndex}
        disabled={rebuilding}
        className="ui-button ui-button-secondary chat-warning-action text-xs"
      >
        {rebuilding ? "Rebuilding..." : "Rebuild Index"}
      </button>
    </div>
  );
}
