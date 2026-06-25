import assert from "node:assert/strict";
import { streamChatResponse } from "./client-api";

async function main() {
  const originalFetch = globalThis.fetch;
  const encoder = new TextEncoder();
  const streamBody =
    '\n{not-json\n{"type":"citations","sources":[{"skillName":"demo","section":"Intro","score":0.8,"preview":"Use this."}]}\n{"type":"text","text":"final chunk"}\n{"type":"error","message":"No auth"}';
  const first = encoder.encode(streamBody.slice(0, 35));
  const second = encoder.encode(streamBody.slice(35));
  const events: string[] = [];
  const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

  try {
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ input, init });
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(first);
            controller.enqueue(second);
            controller.close();
          },
        }),
      );
    }) as typeof fetch;

    await streamChatResponse("hello", {
      onCitations: (sources) => events.push(`citations:${sources.length}`),
      onText: (text) => events.push(`text:${text}`),
      onError: (message) => events.push(`error:${message}`),
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(events, [
    "citations:1",
    "text:final chunk",
    "error:No auth",
  ]);
  assert.equal(calls[0].input, "/api/chat");
  assert.equal(calls[0].init?.method, "POST");
  assert.deepEqual(calls[0].init?.headers, {
    "Content-Type": "application/json",
  });
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { query: "hello" });

  console.log("Chat client API tests passed");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
