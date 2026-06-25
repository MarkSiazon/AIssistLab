import Link from "next/link";
import type {
  KeyboardEvent,
  RefObject,
} from "react";
import { APP_ROUTES } from "@/lib/routes/app-routes";
import type { ChatReadinessActionVisibility } from "@/lib/ui/chat-empty-state";
import type { ChatComposerActionState } from "@/lib/ui/chat-composer-action";
import type { ChatStatusTone } from "@/lib/ui/chat-readiness-panel";

interface ChatComposerProps {
  actionVisibility: ChatReadinessActionVisibility;
  composerAction: ChatComposerActionState;
  helpText: string;
  input: string;
  inputLocked: boolean;
  placeholder: string;
  rebuilding: boolean;
  sendBlocked: boolean;
  sendDisabled: boolean;
  statusDetail: string;
  statusError: string | null;
  statusTitle: string;
  statusTone: ChatStatusTone;
  textareaRef: RefObject<HTMLTextAreaElement>;
  onInputChange: (value: string) => void;
  onKeyDown: (
    event: KeyboardEvent<HTMLTextAreaElement>,
    options: { disabled: boolean },
  ) => void;
  onRebuildIndex: () => void;
  onSendMessage: () => void;
}

export function ChatComposer({
  actionVisibility,
  composerAction,
  helpText,
  input,
  inputLocked,
  placeholder,
  rebuilding,
  sendBlocked,
  sendDisabled,
  statusDetail,
  statusError,
  statusTitle,
  statusTone,
  textareaRef,
  onInputChange,
  onKeyDown,
  onRebuildIndex,
  onSendMessage,
}: ChatComposerProps) {
  return (
    <div
      className="chat-composer border-t"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <label htmlFor="chat-query" className="chat-composer-label">
        Message
      </label>
      <div
        className={`chat-composer-status-card chat-composer-status-card-${statusTone}`}
        role={statusTone === "error" ? "alert" : "status"}
      >
        <div className="chat-composer-status-copy">
          <div className="chat-composer-status-title">{statusTitle}</div>
          <div className="chat-composer-status-detail">{statusDetail}</div>
        </div>
        <div className="chat-composer-status-actions">
          {(sendBlocked || statusError) && (
            <Link
              href={APP_ROUTES.settings}
              className="ui-button ui-button-secondary text-xs"
            >
              Settings
            </Link>
          )}
          {actionVisibility.showComposerIndexAction && (
            <button
              type="button"
              onClick={onRebuildIndex}
              disabled={rebuilding}
              className="ui-button ui-button-secondary text-xs"
            >
              {rebuilding ? "Rebuilding..." : "Rebuild Index"}
            </button>
          )}
          {(sendBlocked || statusError) && (
            <Link
              href={APP_ROUTES.exportDiagnostics}
              className="ui-button ui-button-subtle text-xs"
            >
              Export Diagnostics
            </Link>
          )}
        </div>
      </div>
      <div className="chat-composer-row">
        <textarea
          id="chat-query"
          ref={textareaRef}
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => onKeyDown(event, { disabled: sendDisabled })}
          placeholder={placeholder}
          rows={2}
          className="chat-input text-sm"
          aria-describedby="chat-composer-status"
          readOnly={inputLocked}
          aria-invalid={sendBlocked ? "true" : "false"}
          style={{
            background: "var(--surface-2)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        />
        <button
          type="button"
          onClick={onSendMessage}
          disabled={sendDisabled}
          aria-label={composerAction.ariaLabel}
          title={composerAction.disabledReason ?? undefined}
          className={`ui-button text-sm ${
            sendDisabled ? "ui-button-secondary" : "ui-button-primary"
          }`}
        >
          {composerAction.buttonLabel}
        </button>
      </div>
      <div
        id="chat-composer-status"
        className={`chat-composer-help ${
          sendBlocked ? "chat-composer-help-error" : ""
        }`}
        aria-live="polite"
      >
        {helpText}
      </div>
    </div>
  );
}
