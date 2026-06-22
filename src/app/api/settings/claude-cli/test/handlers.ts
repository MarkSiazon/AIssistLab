import { NextResponse } from "next/server";
import { readClaudeProfileSelectionRequest } from "@/lib/claude/profile-selection-request";
import type { ClaudeProfileSelectionInput } from "@/lib/claude/discovery";
import { withLocalCliGuard } from "@/lib/local-access";
import {
  sanitizeCliOutput,
  testClaudeCli,
} from "@/lib/rag/llm-config";

interface ClaudeCliTestRouteDependencies {
  testClaudeCli?: (
    selection?: ClaudeProfileSelectionInput,
  ) => ReturnType<typeof testClaudeCli>;
  readClaudeProfileSelectionRequest?: typeof readClaudeProfileSelectionRequest;
  sanitizeCliOutput?: typeof sanitizeCliOutput;
}

export function createClaudeCliTestRouteHandlers(
  dependencies: ClaudeCliTestRouteDependencies = {},
) {
  const runTest = dependencies.testClaudeCli ?? testClaudeCli;
  const readSelection =
    dependencies.readClaudeProfileSelectionRequest ??
    readClaudeProfileSelectionRequest;
  const sanitize = dependencies.sanitizeCliOutput ?? sanitizeCliOutput;

  return {
    POST: withLocalCliGuard(async (request: Request) => {
      try {
        const selection = await readSelection(request);
        return NextResponse.json(await runTest(selection));
      } catch (err) {
        const message =
          err instanceof Error ? sanitize(err.message) : "Unknown error";
        return NextResponse.json(
          { checked: true, ok: false, output: null, error: message },
          { status: 400 },
        );
      }
    }),
  };
}
