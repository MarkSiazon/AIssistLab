import Anthropic from "@anthropic-ai/sdk";
import { SearchResult } from "@/types/skill";
import {
  getLlmProvider,
  runClaudeCliPrompt,
} from "@/lib/rag/llm-config";
import { getRuntimeProviderValue } from "@/lib/settings/runtime-config";

let anthropic: Anthropic | null = null;
let anthropicApiKey: string | null = null;

function getAnthropicClient(): Anthropic {
  const apiKey = getRuntimeProviderValue("ANTHROPIC_API_KEY");

  if (!apiKey || apiKey === "your-api-key-here" || apiKey === "sk-ant-...") {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Add a valid API key or switch LLM_PROVIDER to claude_code_cli for local CLI mode.",
    );
  }

  if (!anthropic || anthropicApiKey !== apiKey) {
    anthropic = new Anthropic({ apiKey });
    anthropicApiKey = apiKey;
  }
  return anthropic;
}

function buildSystemPrompt(results: SearchResult[]): string {
  if (results.length === 0) {
    return `You are an expert assistant for a Claude Code skill development workspace.
Skills are markdown prompt files stored in .claude/skills/ that automate tasks when invoked as /skill-name slash commands in Claude Code sessions.
No relevant skills were found for this query. Answer based on general Claude Code knowledge, or ask the user to clarify.`;
  }

  const contextBlocks = results
    .map(
      (r) =>
        `--- Source: ${r.chunk.skillName}.md (${r.chunk.sourceLines}, relevance: ${r.score.toFixed(2)}) ---\n${r.chunk.text}`,
    )
    .join("\n\n");

  return `You are an expert assistant for a Claude Code skill development workspace.
Skills are markdown prompt files stored in .claude/skills/ that automate tasks when invoked as /skill-name slash commands in Claude Code sessions.

Answer the user's question using the retrieved skill documentation below. Always cite which skill file your answer comes from (e.g., "from pr-description.md"). If the answer is not in the provided context, say so clearly and offer general guidance.

## Retrieved Context

${contextBlocks}`;
}

export async function* generateStream(
  query: string,
  results: SearchResult[],
): AsyncGenerator<string> {
  const systemPrompt = buildSystemPrompt(results);

  if (getLlmProvider() === "claude_code_cli") {
    const response = await runClaudeCliPrompt(query, systemPrompt);
    if (response) yield response;
    return;
  }

  const stream = getAnthropicClient().messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: query }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
