import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/responses";
import { readClaudeProfileSelectionRequest } from "@/lib/claude/profile-selection-request";
import type { ClaudeProfileSelectionInput } from "@/lib/claude/discovery";
import { withLocalCliGuard } from "@/lib/local-access";
import {
  getClaudeCliStatus,
  launchClaudeLogin,
  sanitizeCliOutput,
} from "@/lib/rag/llm-config";

interface ClaudeCliRouteDependencies {
  getClaudeCliStatus?: typeof getClaudeCliStatus;
  launchClaudeLogin?: (
    selection?: ClaudeProfileSelectionInput,
  ) => ReturnType<typeof launchClaudeLogin>;
  readClaudeProfileSelectionRequest?: typeof readClaudeProfileSelectionRequest;
  sanitizeCliOutput?: typeof sanitizeCliOutput;
}

export function createClaudeCliRouteHandlers(
  dependencies: ClaudeCliRouteDependencies = {},
) {
  const loadStatus = dependencies.getClaudeCliStatus ?? getClaudeCliStatus;
  const openLogin = dependencies.launchClaudeLogin ?? launchClaudeLogin;
  const readSelection =
    dependencies.readClaudeProfileSelectionRequest ??
    readClaudeProfileSelectionRequest;
  const sanitize = dependencies.sanitizeCliOutput ?? sanitizeCliOutput;

  return {
    GET: withLocalCliGuard(async () => NextResponse.json(await loadStatus())),
    POST: withLocalCliGuard(async (request: Request) => {
      try {
        const selection = await readSelection(request);
        return NextResponse.json(await openLogin(selection));
      } catch (err) {
        const message =
          err instanceof Error ? sanitize(err.message) : "Unknown error";
        return jsonError(message, 400);
      }
    }),
  };
}
