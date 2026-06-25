import {
  apiErrorMessage,
  jsonRequestInit,
  readResponseJson,
  requestJson,
} from "@/lib/api/client";
import type { ChatReadinessReleaseSummary, ChatReadinessStatus } from "@/lib/ui/chat-readiness-panel";
import type { Citation, StreamChunk } from "@/types/chat";

export interface ChatStatus extends ChatReadinessStatus {
  claudeCliEnabled: boolean;
  suggestedQuestions: string[];
}

export interface ReleaseReadinessSummary {
  summary: ChatReadinessReleaseSummary & {
    canExportDiagnostics: boolean;
  };
}

export interface ChatStreamHandlers {
  onCitations: (sources: Citation[]) => void;
  onText: (text: string) => void;
  onError: (message: string) => void;
}

export async function fetchChatStatus(): Promise<ChatStatus> {
  return requestJson<ChatStatus>(
    "/api/chat/status",
    undefined,
    "Unable to load chat status",
  );
}

export async function fetchChatReleaseReadiness(): Promise<ReleaseReadinessSummary> {
  return requestJson<ReleaseReadinessSummary>(
    "/api/release/readiness",
    undefined,
    "Unable to load release readiness",
  );
}

export async function rebuildChatIndex(): Promise<void> {
  await requestJson<unknown>(
    "/api/index",
    { method: "POST" },
    "Unable to rebuild index",
  );
}

function parseChatStreamLine(line: string): StreamChunk | null {
  if (!line.trim()) return null;
  try {
    return JSON.parse(line) as StreamChunk;
  } catch {
    return null;
  }
}

function handleChatStreamChunk(
  chunk: StreamChunk | null,
  handlers: ChatStreamHandlers,
) {
  if (!chunk) return;
  if (chunk.type === "citations") {
    handlers.onCitations(chunk.sources);
  } else if (chunk.type === "text") {
    handlers.onText(chunk.text);
  } else if (chunk.type === "error") {
    handlers.onError(chunk.message);
  }
}

export async function streamChatResponse(
  query: string,
  handlers: ChatStreamHandlers,
): Promise<void> {
  const response = await fetch("/api/chat", {
    ...jsonRequestInit("POST", { query }),
  });

  if (!response.ok || !response.body) {
    const payload = await readResponseJson(response);
    throw new Error(apiErrorMessage(payload, "API error"));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      handleChatStreamChunk(parseChatStreamLine(line), handlers);
    }
  }

  buffer += decoder.decode();
  handleChatStreamChunk(parseChatStreamLine(buffer), handlers);
}
