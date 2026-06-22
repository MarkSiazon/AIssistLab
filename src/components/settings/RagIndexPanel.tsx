import type { PublicIndexState } from "@/lib/rag/index-state";
import { indexStatusCountsLabel } from "@/lib/ui/index-status-summary";
import {
  indexStatusColor,
  indexStatusLabel,
} from "@/lib/ui/settings-status";

interface RagIndexPanelProps {
  indexStatus: PublicIndexState | null;
  rebuilding: boolean;
  onRebuild: () => void;
}

export function RagIndexPanel({
  indexStatus,
  rebuilding,
  onRebuild,
}: RagIndexPanelProps) {
  return (
    <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
      <div
        className="text-xs font-medium mb-2"
        style={{ color: "var(--text-muted)" }}
      >
        RAG Index
      </div>
      {indexStatus ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: indexStatusColor(indexStatus.status),
              }}
            />
            <span className="text-xs">
              {indexStatusLabel(indexStatus.status)}
            </span>
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {indexStatusCountsLabel(indexStatus)}
          </div>
          {(indexStatus.staleReason || indexStatus.error) && (
            <div
              className="text-xs"
              style={{ color: "var(--yellow)", lineHeight: 1.4 }}
            >
              {indexStatus.staleReason ?? indexStatus.error}
            </div>
          )}
          {indexStatus.builtAt && (
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              Built {new Date(indexStatus.builtAt).toLocaleTimeString()}
            </div>
          )}
          <button
            type="button"
            onClick={onRebuild}
            disabled={rebuilding}
            className="ui-button ui-button-secondary text-xs mt-2"
            style={{
              opacity: rebuilding ? 0.7 : 1,
            }}
          >
            {rebuilding ? "Rebuilding..." : "Rebuild Index"}
          </button>
        </div>
      ) : (
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          Loading...
        </div>
      )}
    </div>
  );
}
