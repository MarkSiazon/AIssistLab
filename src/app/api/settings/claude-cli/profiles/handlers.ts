import { NextResponse } from "next/server";
import {
  sanitizeCliOutput,
  getClaudeCliStatus,
} from "@/lib/rag/llm-config";
import { withLocalCliGuard } from "@/lib/local-access";
import type { ClaudeProfileAuthState, ClaudeProfileSummary } from "@/lib/claude/discovery";
import type { ClaudeCliStatus } from "@/lib/rag/claude-cli-status";

interface ClaudeCliProfilesRouteDependencies {
  getClaudeCliStatus?: typeof getClaudeCliStatus;
  sanitizeCliOutput?: typeof sanitizeCliOutput;
}

function publicProfileAuth(
  auth: ClaudeProfileAuthState,
  sanitize: typeof sanitizeCliOutput,
): ClaudeProfileAuthState {
  return {
    checked: auth.checked,
    loggedIn: auth.loggedIn,
    method: auth.method ? sanitize(auth.method) : null,
    error: auth.error ? sanitize(auth.error) : null,
  };
}

function publicProfile(
  profile: ClaudeProfileSummary,
  sanitize: typeof sanitizeCliOutput,
): ClaudeProfileSummary {
  return {
    id: profile.id,
    label: sanitize(profile.label),
    source: profile.source,
    displayPath: sanitize(profile.displayPath),
    selected: profile.selected,
    exists: profile.exists,
    auth: publicProfileAuth(profile.auth, sanitize),
  };
}

export function toClaudeCliProfilesResponse(
  status: ClaudeCliStatus,
  sanitize: typeof sanitizeCliOutput = sanitizeCliOutput,
) {
  return {
    selectedProfile: publicProfile(status.selectedProfile, sanitize),
    profiles: status.profiles.map((profile) => publicProfile(profile, sanitize)),
    configDirConfigured: status.configDirConfigured,
    loginCommandSource: status.loginCommandSource,
    canOpenLogin: status.canOpenLogin,
  };
}

export function createClaudeCliProfilesRouteHandlers(
  dependencies: ClaudeCliProfilesRouteDependencies = {},
) {
  const loadStatus = dependencies.getClaudeCliStatus ?? getClaudeCliStatus;
  const sanitize = dependencies.sanitizeCliOutput ?? sanitizeCliOutput;

  return {
    GET: withLocalCliGuard(async () => {
      const status = await loadStatus();
      return NextResponse.json(toClaudeCliProfilesResponse(status, sanitize));
    }),
  };
}
