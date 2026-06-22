import {
  getLastClaudeCliTestForProfile,
  type ClaudeCliTestResult,
} from "@/lib/rag/claude-cli-test-state";
import { createAsyncTtlCache } from "@/lib/async-ttl-cache";
import { runProcess, sanitizeCliOutput } from "@/lib/rag/claude-cli-process";
import {
  discoverClaudeProfileState,
  toPortableHomePath,
  type ClaudeCommandSource,
  type ClaudeProfileAuthState,
  type ClaudeProfileSummary,
} from "@/lib/claude/discovery";
import {
  getClaudeCliEnv,
  getClaudeCliPath,
  getClaudeConfigDir,
  getClaudeLoginCommand,
  getLlmProvider,
  isClaudeCliEnabled,
  profileConfigDir,
  profileFingerprint,
  resolveClaudeCliCommand,
  resolveClaudeLoginCommand,
} from "@/lib/rag/claude-cli-runtime";
import type { LlmProvider } from "@/lib/rag/llm-types";

export interface ClaudeCliStatus {
  provider: LlmProvider;
  enabled: boolean;
  cliPath: string;
  configuredCliPath: string;
  cliPathSource: "env" | "native-install" | "path";
  loginCommand: string;
  loginCommandSource: ClaudeCommandSource;
  loginHelperAvailable: boolean;
  canOpenLogin: boolean;
  configDirConfigured: boolean;
  installed: boolean;
  version: string | null;
  profiles: ClaudeProfileSummary[];
  selectedProfile: ClaudeProfileSummary;
  selectedProfileFingerprint: string;
  lastCliSmokeTest: ClaudeCliTestResult | null;
  auth: ClaudeProfileAuthState;
}

export interface ClaudeCliStatusOptions {
  forceRefresh?: boolean;
}

const CLAUDE_CLI_STATUS_CACHE_TTL_MS = 5_000;
const claudeCliStatusCache = createAsyncTtlCache<ClaudeCliStatus>({
  ttlMs: CLAUDE_CLI_STATUS_CACHE_TTL_MS,
});

function claudeCliStatusCacheKey(): string {
  return JSON.stringify({
    provider: getLlmProvider(),
    enabled: isClaudeCliEnabled(),
    cliPath: getClaudeCliPath(),
    loginCommand: getClaudeLoginCommand(),
    configDir: getClaudeConfigDir(),
  });
}

export function clearClaudeCliStatusCache(): void {
  claudeCliStatusCache.clear();
}

function summarizeAuthMethod(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.trim().length === 0) return null;
  const value = raw.toLowerCase();

  if (value.includes("api")) return "API key";
  if (
    value.includes("subscription") ||
    value.includes("pro") ||
    value.includes("max")
  ) {
    return "Claude subscription";
  }
  if (value.includes("claude")) return "Claude account";

  return "Configured";
}

function applySelectedProfileAuth(
  profiles: ClaudeProfileSummary[],
  auth: ClaudeProfileAuthState,
): {
  profiles: ClaudeProfileSummary[];
  selectedProfile: ClaudeProfileSummary;
} {
  const updatedProfiles = profiles.map((profile) =>
    profile.selected ? { ...profile, auth } : profile,
  );
  return {
    profiles: updatedProfiles,
    selectedProfile:
      updatedProfiles.find((profile) => profile.selected) ?? updatedProfiles[0],
  };
}

async function readClaudeCliStatus(): Promise<ClaudeCliStatus> {
  const resolvedCli = await resolveClaudeCliCommand();
  const profileState = await discoverClaudeProfileState({
    configuredConfigDir: getClaudeConfigDir(),
  });
  const selectedProfile = profileState.selectedProfile;
  const selectedInternalProfile = profileState.selectedInternalProfile;
  const resolvedLogin = await resolveClaudeLoginCommand(resolvedCli.command);
  const baseAuth: ClaudeProfileAuthState = {
    checked: false,
    loggedIn: null,
    method: null,
    error: null,
  };

  const selectedProfileFingerprint = profileFingerprint(
    getLlmProvider(),
    selectedInternalProfile,
  );
  const status: ClaudeCliStatus = {
    provider: getLlmProvider(),
    enabled: isClaudeCliEnabled(),
    cliPath: resolvedCli.displayCommand,
    configuredCliPath: sanitizeCliOutput(
      toPortableHomePath(resolvedCli.configuredCliPath),
    ),
    cliPathSource: resolvedCli.source,
    loginCommand: resolvedLogin.displayCommand,
    loginCommandSource: resolvedLogin.source,
    loginHelperAvailable: resolvedLogin.available,
    canOpenLogin: resolvedLogin.available,
    configDirConfigured: getClaudeConfigDir() !== null,
    installed: false,
    version: null,
    profiles: profileState.profiles,
    selectedProfile,
    selectedProfileFingerprint,
    lastCliSmokeTest: await getLastClaudeCliTestForProfile(
      getLlmProvider(),
      selectedProfile,
      selectedProfileFingerprint,
    ),
    auth: baseAuth,
  };

  const version = await runProcess(resolvedCli.command, ["--version"], {
    env: getClaudeCliEnv(profileConfigDir(selectedInternalProfile)),
    timeoutMs: 10_000,
  });

  if (version.code !== 0) {
    status.auth = {
      checked: false,
      loggedIn: null,
      method: null,
      error: sanitizeCliOutput(
        version.error || version.stderr || version.stdout || "Claude CLI not found.",
      ),
    };
    const withAuth = applySelectedProfileAuth(status.profiles, status.auth);
    status.profiles = withAuth.profiles;
    status.selectedProfile = withAuth.selectedProfile;
    return status;
  }

  status.installed = true;
  status.canOpenLogin = true;
  status.version = sanitizeCliOutput(version.stdout || version.stderr);

  const auth = await runProcess(
    resolvedCli.command,
    ["auth", "status", "--json"],
    {
      env: getClaudeCliEnv(profileConfigDir(selectedInternalProfile)),
      timeoutMs: 15_000,
    },
  );

  status.auth = {
    checked: true,
    loggedIn: null,
    method: null,
    error: null,
  };

  if (auth.code !== 0) {
    status.auth.loggedIn = false;
    status.auth.error = sanitizeCliOutput(auth.stderr || auth.stdout);
    const withAuth = applySelectedProfileAuth(status.profiles, status.auth);
    status.profiles = withAuth.profiles;
    status.selectedProfile = withAuth.selectedProfile;
    return status;
  }

  try {
    const parsed = JSON.parse(auth.stdout) as {
      loggedIn?: boolean;
      loginMethod?: string;
    };
    status.auth.loggedIn = parsed.loggedIn ?? true;
    status.auth.method = summarizeAuthMethod(parsed.loginMethod);
  } catch {
    status.auth.loggedIn = true;
    status.auth.method = "Configured";
  }

  const withAuth = applySelectedProfileAuth(status.profiles, status.auth);
  status.profiles = withAuth.profiles;
  status.selectedProfile = withAuth.selectedProfile;
  return status;
}

export async function getClaudeCliStatus(
  options: ClaudeCliStatusOptions = {},
): Promise<ClaudeCliStatus> {
  return claudeCliStatusCache.get(claudeCliStatusCacheKey(), readClaudeCliStatus, {
    forceRefresh: options.forceRefresh,
  });
}
