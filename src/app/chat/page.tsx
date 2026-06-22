"use client";

import Link from "next/link";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import {
  ChatBlockedAlert,
  ChatIndexAlert,
} from "@/components/chat/ChatReadinessAlerts";
import { useChatController } from "@/hooks/useChatController";
import type { ChatEmptyAction } from "@/lib/ui/chat-empty-state";
import { buildChatPageModel } from "@/lib/ui/chat-page-model";
import { isSafeInternalActionHref } from "@/lib/ui/internal-action-href";

export default function ChatPage() {
  const {
    bottomRef,
    chatStatus,
    chatStatusError,
    clearMessages,
    copiedMessageId,
    copyMessage,
    copyNotice,
    handleComposerKeyDown,
    input,
    messages,
    rebuilding,
    rebuildIndex,
    releaseReadiness,
    retryAssistantMessage,
    selectSuggestion,
    sendMessage,
    setInput,
    streaming,
    textareaRef,
  } = useChatController();

  const pageModel = buildChatPageModel({
    status: chatStatus,
    statusError: chatStatusError,
    releaseSummary: releaseReadiness?.summary ?? null,
    inputValue: input,
    streaming,
  });

  function renderChatEmptyAction(action: ChatEmptyAction) {
    const className = `ui-button ${
      action.variant === "primary" ? "ui-button-primary" : "ui-button-secondary"
    } text-sm`;

    if (action.id === "rebuild-index") {
      return (
        <button
          key={action.id}
          type="button"
          onClick={rebuildIndex}
          disabled={rebuilding || chatStatus?.index.status === "rebuilding"}
          className={className}
        >
          {rebuilding ? "Rebuilding..." : action.label}
        </button>
      );
    }

    if (!isSafeInternalActionHref(action.href)) return null;

    return (
      <Link key={action.id} href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }

  return (
    <div className="chat-shell">
      <ChatHeader
        hasMessages={messages.length > 0}
        sendBlocked={pageModel.sendBlocked}
        statusChips={pageModel.statusChips}
        onClearMessages={clearMessages}
      />

      <ChatBlockedAlert
        status={chatStatus}
        releaseTopAction={releaseReadiness?.summary.topAction}
      />

      <ChatIndexAlert
        status={chatStatus}
        show={pageModel.actionVisibility.showIndexAlert}
        rebuilding={rebuilding}
        onRebuildIndex={rebuildIndex}
      />

      <ChatMessageList
        messages={messages}
        copyNotice={copyNotice}
        emptyStateCopy={pageModel.emptyStateCopy}
        chatStatusReady={chatStatus ? chatStatus.canSend : null}
        chatStatusPending={pageModel.chatStatusPending}
        chatStatusError={chatStatusError}
        readinessRows={pageModel.readinessRows}
        emptyActions={pageModel.emptyActions}
        emptySuggestions={pageModel.emptySuggestions}
        copiedMessageId={copiedMessageId}
        streaming={streaming}
        bottomRef={bottomRef}
        onRenderEmptyAction={renderChatEmptyAction}
        onSuggestionSelect={selectSuggestion}
        onCopyMessage={copyMessage}
        onRetryAssistantMessage={retryAssistantMessage}
      />

      <ChatComposer
        actionVisibility={pageModel.actionVisibility}
        composerAction={pageModel.composerAction}
        helpText={pageModel.composerHelp}
        input={input}
        inputLocked={pageModel.inputLocked}
        placeholder={pageModel.composerPlaceholder}
        rebuilding={rebuilding}
        sendBlocked={pageModel.sendBlocked}
        sendDisabled={pageModel.sendDisabled}
        statusDetail={pageModel.composerStatusDetail}
        statusError={chatStatusError}
        statusTitle={pageModel.composerStatusTitle}
        statusTone={pageModel.composerStatusTone}
        textareaRef={textareaRef}
        onInputChange={setInput}
        onKeyDown={handleComposerKeyDown}
        onRebuildIndex={rebuildIndex}
        onSendMessage={sendMessage}
      />
    </div>
  );
}
