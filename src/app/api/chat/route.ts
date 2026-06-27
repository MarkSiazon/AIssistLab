import { retrieve } from "@/lib/rag/retriever";
import { generateStream } from "@/lib/rag/generator";
import { ensureFreshIndex } from "@/lib/store";
import {
  forbidNonLocalCliRequest,
  withLocalDeviceGuard,
} from "@/lib/local-access";
import { getLlmProvider, isClaudeCliEnabled } from "@/lib/rag/llm-config";
import { readJsonObject } from "@/lib/api/request";
import { jsonError } from "@/lib/api/responses";

export const runtime = "nodejs";

function streamError(message: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(JSON.stringify({ type: "citations", sources: [] }) + "\n"),
      );
      controller.enqueue(
        encoder.encode(JSON.stringify({ type: "error", message }) + "\n"),
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}

async function readChatQuery(request: Request): Promise<string | null> {
  const body = await readJsonObject(request);
  const query = body?.query;
  if (typeof query !== "string") return null;
  const trimmed = query.trim();
  return trimmed ? trimmed : null;
}

export const POST = withLocalDeviceGuard(async (request: Request) => {
  const query = await readChatQuery(request);

  if (!query) {
    return jsonError("query is required", 400);
  }

  if (getLlmProvider() === "claude_code_cli") {
    const forbidden = forbidNonLocalCliRequest(request);

    if (forbidden) return forbidden;

    if (!isClaudeCliEnabled()) {
      return jsonError(
        "Local Claude CLI mode is disabled. Set ENABLE_LOCAL_CLAUDE_CLI=true to use it.",
        403,
      );
    }
  }

  let index;
  try {
    index = await ensureFreshIndex();
  } catch (error) {
    return streamError(
      error instanceof Error ? error.message : "Unable to build RAG index.",
    );
  }

  const results = retrieve(query, index, 5);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // First line: citations metadata
      const citationLine =
        JSON.stringify({
          type: "citations",
          sources: results.map((r) => ({
            skillName: r.chunk.skillName,
            section: r.chunk.sourceLines,
            score: Math.round(r.score * 100) / 100,
            preview: r.chunk.text.slice(0, 250),
          })),
        }) + "\n";

      controller.enqueue(encoder.encode(citationLine));

      try {
        for await (const textChunk of generateStream(query, results)) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ type: "text", text: textChunk }) + "\n",
            ),
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: "error", message: msg }) + "\n",
          ),
        );
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
});
