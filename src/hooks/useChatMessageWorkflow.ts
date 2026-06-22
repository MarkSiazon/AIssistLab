"use client";

import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import type { Message } from "@/types/chat";
import {
  streamChatResponse,
  type ChatStatus,
} from "@/lib/chat/client-api";

interface ChatMessageWorkflowInput {
  chatStatus: ChatStatus | null;
  chatStatusError: string | null;
  input: string;
  loadChatStatus: () => Promise<void>;
  setInput: Dispatch<SetStateAction<string>>;
}

export function useChatMessageWorkflow({
  chatStatus,
  chatStatusError,
  input,
  loadChatStatus,
  setInput,
}: ChatMessageWorkflowInput) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);

  const streamAssistantResponse = useCallback(
    async (query: string, assistantId: string) => {
      try {
        await streamChatResponse(query, {
          onCitations: (sources) => {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantId
                  ? { ...message, citations: sources }
                  : message,
              ),
            );
          },
          onText: (text) => {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantId
                  ? { ...message, content: message.content + text }
                  : message,
              ),
            );
          },
          onError: (message) => {
            setMessages((prev) =>
              prev.map((item) =>
                item.id === assistantId
                  ? {
                      ...item,
                      content: `Error: ${message}`,
                      streaming: false,
                      error: true,
                      retryQuery: query,
                    }
                  : item,
              ),
            );
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setMessages((prev) =>
          prev.map((item) =>
            item.id === assistantId
              ? {
                  ...item,
                  content: `Failed to get response: ${message}`,
                  streaming: false,
                  error: true,
                  retryQuery: query,
                }
              : item,
          ),
        );
      } finally {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? { ...message, streaming: false }
              : message,
          ),
        );
        setStreaming(false);
        loadChatStatus();
      }
    },
    [loadChatStatus],
  );

  const sendMessage = useCallback(async () => {
    const query = input.trim();
    if (!query || streaming) return;
    if (!chatStatus || chatStatusError) return;
    if (chatStatus.canSend === false) return;

    setInput("");
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    };
    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      citations: [],
      streaming: true,
      retryQuery: query,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);
    await streamAssistantResponse(query, assistantId);
  }, [
    chatStatus,
    chatStatusError,
    input,
    setInput,
    streamAssistantResponse,
    streaming,
  ]);

  const retryAssistantMessage = useCallback(
    async (message: Message) => {
      if (!message.retryQuery || streaming) return;
      setMessages((prev) =>
        prev.map((item) =>
          item.id === message.id
            ? {
                ...item,
                content: "",
                citations: [],
                streaming: true,
                error: false,
              }
            : item,
        ),
      );
      setStreaming(true);
      await streamAssistantResponse(message.retryQuery, message.id);
    },
    [streamAssistantResponse, streaming],
  );

  return {
    clearMessages: () => setMessages([]),
    messages,
    retryAssistantMessage,
    sendMessage,
    streaming,
  };
}
