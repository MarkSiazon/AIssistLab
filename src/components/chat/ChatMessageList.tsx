"use client";

import type { ReactNode, RefObject } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/types/chat";
import { EmptyStateIcon } from "@/components/ui/EmptyStateIcon";
import { ChatReadinessPanel } from "@/components/chat/ChatReadinessPanel";
import { CitationBadge } from "@/components/chat/CitationBadge";
import { countLabel } from "@/lib/format/count-label";
import type { ChatEmptyAction } from "@/lib/ui/chat-empty-state";
import type {
  ChatEmptyStateCopy,
  ChatReadinessRow,
} from "@/lib/ui/chat-readiness-panel";

interface ChatMessageListProps {
  messages: Message[];
  copyNotice: string | null;
  emptyStateCopy: ChatEmptyStateCopy;
  chatStatusReady: boolean | null;
  chatStatusPending: boolean;
  chatStatusError: string | null;
  readinessRows: ChatReadinessRow[];
  emptyActions: ChatEmptyAction[];
  emptySuggestions: string[];
  copiedMessageId: string | null;
  streaming: boolean;
  bottomRef: RefObject<HTMLDivElement>;
  onRenderEmptyAction: (action: ChatEmptyAction) => ReactNode;
  onSuggestionSelect: (question: string) => void;
  onCopyMessage: (message: Message) => void;
  onRetryAssistantMessage: (message: Message) => void;
}

export function ChatMessageList({
  messages,
  copyNotice,
  emptyStateCopy,
  chatStatusReady,
  chatStatusPending,
  chatStatusError,
  readinessRows,
  emptyActions,
  emptySuggestions,
  copiedMessageId,
  streaming,
  bottomRef,
  onRenderEmptyAction,
  onSuggestionSelect,
  onCopyMessage,
  onRetryAssistantMessage,
}: ChatMessageListProps) {
  return (
    <div className="chat-message-list">
      <div className="sr-only" aria-live="polite">
        {copyNotice ?? ""}
      </div>
      {messages.length === 0 && (
        <div className="chat-empty-state">
          <EmptyStateIcon name="chat" label="Chat" />
          <div className="chat-empty-title">{emptyStateCopy.title}</div>
          <div
            className="chat-empty-copy text-sm text-center"
            style={{ color: "var(--text-muted)" }}
          >
            {emptyStateCopy.message}
          </div>
          {chatStatusReady !== null ? (
            <ChatReadinessPanel
              status={chatStatusReady ? "ready" : "blocked"}
              subtitle={chatStatusReady ? "Ready for first chat" : "Setup required"}
              rows={readinessRows}
            />
          ) : (
            <ChatReadinessPanel
              status={chatStatusPending ? "checking" : "unavailable"}
              subtitle={
                chatStatusPending
                  ? "Status check in progress"
                  : "Status check failed"
              }
              rows={[]}
              pendingDetail={
                chatStatusPending
                  ? "Waiting for local status APIs."
                  : chatStatusError
              }
            />
          )}
          {emptyActions.length > 0 && (
            <div className="chat-empty-actions">
              {emptyActions.map(onRenderEmptyAction)}
            </div>
          )}
          {emptySuggestions.length > 0 && (
            <div className="chat-suggestions">
              {emptySuggestions.map((question) => (
                <button
                  type="button"
                  key={question}
                  onClick={() => onSuggestionSelect(question)}
                  className="chat-suggestion-button"
                >
                  {question}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {messages.map((message) => {
        const citationCount = message.citations?.length ?? 0;
        const copied = copiedMessageId === message.id;
        const hasCopyableContent = message.content.trim().length > 0;
        const statusLabel = message.streaming
          ? "Streaming"
          : message.error
            ? "Failed"
            : citationCount > 0
              ? countLabel(citationCount, "source")
              : message.role === "assistant"
                ? "No sources"
                : "Sent";

        return (
          <div
            key={message.id}
            className={`chat-message-row ${
              message.role === "user" ? "chat-message-row-user" : ""
            }`}
          >
            <div className="chat-message-width">
              <div
                className={`chat-message-frame ${
                  message.role === "user" ? "chat-message-frame-user" : ""
                }`}
              >
                <div
                  className={`chat-message-meta ${
                    message.role === "user" ? "chat-message-meta-user" : ""
                  }`}
                >
                  <div className="chat-message-meta-copy">
                    <span className="chat-message-role">
                      {message.role === "user" ? "You" : "Assistant"}
                    </span>
                    <span className="chat-message-state">{statusLabel}</span>
                  </div>
                  <div className="chat-message-actions">
                    <button
                      type="button"
                      onClick={() => onCopyMessage(message)}
                      disabled={!hasCopyableContent}
                      className="chat-message-action"
                      aria-label={`Copy ${message.role} message`}
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                    {message.role === "assistant" &&
                      message.error &&
                      message.retryQuery && (
                        <button
                          type="button"
                          onClick={() => onRetryAssistantMessage(message)}
                          disabled={streaming}
                          className="chat-message-action chat-message-action-primary"
                        >
                          Retry
                        </button>
                      )}
                  </div>
                </div>
                {message.role === "user" ? (
                  <div className="chat-bubble chat-bubble-user">
                    {message.content}
                  </div>
                ) : (
                  <>
                    <div className="chat-bubble chat-bubble-assistant">
                      {message.content ? (
                        <div className="prose">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : message.streaming ? (
                        <span style={{ color: "var(--text-muted)" }}>
                          Thinking...
                        </span>
                      ) : null}
                      {message.streaming && message.content && (
                        <span
                          className="inline-block w-1.5 h-4 ml-0.5 animate-pulse"
                          style={{
                            background: "var(--accent)",
                            verticalAlign: "text-bottom",
                          }}
                        />
                      )}
                    </div>
                    {message.citations && message.citations.length > 0 && (
                      <div className="chat-citation-list">
                        <div className="chat-citation-heading">Sources</div>
                        {message.citations.map((citation, index) => (
                          <CitationBadge key={index} citation={citation} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
