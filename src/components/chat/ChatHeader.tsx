import type { ChatStatusChip } from "@/lib/ui/chat-readiness-panel";

interface ChatHeaderProps {
  hasMessages: boolean;
  sendBlocked: boolean;
  statusChips: ChatStatusChip[];
  onClearMessages: () => void;
}

export function ChatHeader({
  hasMessages,
  sendBlocked,
  statusChips,
  onClearMessages,
}: ChatHeaderProps) {
  return (
    <div
      className="chat-header border-b"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h1 className="m-0 text-sm font-semibold">RAG Chat</h1>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {sendBlocked
              ? "Resolve readiness before sending"
              : "Ask anything about your skills"}
          </span>
        </div>
        {statusChips.length > 0 && (
          <div className="chat-status-row" aria-label="Chat readiness summary">
            {statusChips.map(({ label, tone }) => (
              <span
                key={label}
                className={`chat-status-chip chat-status-chip-${tone}`}
              >
                <span className="chat-status-chip-dot" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
      {hasMessages && (
        <button
          type="button"
          onClick={onClearMessages}
          className="ui-button ui-button-subtle text-xs"
        >
          Clear
        </button>
      )}
    </div>
  );
}
