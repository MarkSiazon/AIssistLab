"use client";

import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { useChatAutoScroll } from "@/hooks/useChatAutoScroll";
import { useChatClipboard } from "@/hooks/useChatClipboard";
import { useChatIndexRebuild } from "@/hooks/useChatIndexRebuild";
import { useChatMessageWorkflow } from "@/hooks/useChatMessageWorkflow";
import { useChatReadinessState } from "@/hooks/useChatReadinessState";
import { shouldSubmitChatComposer } from "@/lib/ui/chat-composer-keyboard";

export function useChatController() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    chatStatus,
    chatStatusError,
    releaseReadiness,
    loadChatStatus,
    loadReleaseReadiness,
  } = useChatReadinessState();
  const {
    clearMessages,
    messages,
    retryAssistantMessage,
    sendMessage,
    streaming,
  } = useChatMessageWorkflow({
    chatStatus,
    chatStatusError,
    input,
    loadChatStatus,
    setInput,
  });
  const { copiedMessageId, copyMessage, copyNotice } = useChatClipboard();
  const { rebuilding, rebuildIndex } = useChatIndexRebuild({
    loadChatStatus,
    loadReleaseReadiness,
  });
  const bottomRef = useChatAutoScroll(messages);

  const handleComposerKeyDown = useCallback(
    (
      event: KeyboardEvent<HTMLTextAreaElement>,
      options: { disabled: boolean },
    ) => {
      if (
        shouldSubmitChatComposer({
          key: event.key,
          shiftKey: event.shiftKey,
          isComposing: event.nativeEvent.isComposing,
          inputValue: input,
          disabled: options.disabled,
        })
      ) {
        event.preventDefault();
        sendMessage();
      }
    },
    [input, sendMessage],
  );

  const selectSuggestion = useCallback((question: string) => {
    setInput(question);
    textareaRef.current?.focus();
  }, []);

  return {
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
  };
}
