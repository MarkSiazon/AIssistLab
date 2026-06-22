import fs from "node:fs/promises";
import path from "node:path";
import type { ClaudeProfileSummary } from "@/lib/claude/discovery";
import { sanitizeCliOutput } from "@/lib/rag/claude-cli-process";
import type { LlmProvider } from "@/lib/rag/llm-types";

export interface ClaudeCliTestResult {
  checked: boolean;
  ok: boolean | null;
  output: string | null;
  error: string | null;
  provider?: LlmProvider;
  profileId?: string;
  configFingerprint?: string;
}

const globalClaudeCliState = globalThis as typeof globalThis & {
  __LAST_CLAUDE_CLI_TEST?: ClaudeCliTestResult | null;
};

globalClaudeCliState.__LAST_CLAUDE_CLI_TEST ??= null;

function getClaudeCliTestStatePath(): string {
  return (
    process.env.CLAUDE_CLI_TEST_STATE_PATH ||
    path.join(process.cwd(), ".next", "cache", "claude-cli-test-state.json")
  );
}

export function getLastClaudeCliTest(): ClaudeCliTestResult | null {
  return globalClaudeCliState.__LAST_CLAUDE_CLI_TEST ?? null;
}

export function normalizeClaudeCliTestResult(
  value: unknown,
): ClaudeCliTestResult | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ClaudeCliTestResult>;
  if (typeof candidate.checked !== "boolean") return null;
  if (
    candidate.ok !== true &&
    candidate.ok !== false &&
    candidate.ok !== null
  ) {
    return null;
  }
  if (
    candidate.provider !== "anthropic_api" &&
    candidate.provider !== "claude_code_cli"
  ) {
    return null;
  }
  if (typeof candidate.profileId !== "string") return null;
  if (typeof candidate.configFingerprint !== "string") return null;

  return {
    checked: candidate.checked,
    ok: candidate.ok,
    output:
      typeof candidate.output === "string"
        ? sanitizeCliOutput(candidate.output).slice(0, 1_000)
        : null,
    error:
      typeof candidate.error === "string"
        ? sanitizeCliOutput(candidate.error).slice(0, 2_000)
        : null,
    provider: candidate.provider,
    profileId: candidate.profileId,
    configFingerprint: candidate.configFingerprint,
  };
}

export async function readPersistedClaudeCliTest(): Promise<ClaudeCliTestResult | null> {
  try {
    const raw = await fs.readFile(getClaudeCliTestStatePath(), "utf-8");
    const parsed = normalizeClaudeCliTestResult(JSON.parse(raw));
    if (parsed) {
      globalClaudeCliState.__LAST_CLAUDE_CLI_TEST = parsed;
    }
    return parsed;
  } catch {
    return getLastClaudeCliTest();
  }
}

export async function rememberClaudeCliTest(
  result: ClaudeCliTestResult,
): Promise<ClaudeCliTestResult> {
  const safeResult = normalizeClaudeCliTestResult(result) ?? result;
  globalClaudeCliState.__LAST_CLAUDE_CLI_TEST = safeResult;
  try {
    const statePath = getClaudeCliTestStatePath();
    await fs.mkdir(path.dirname(statePath), {
      recursive: true,
    });
    await fs.writeFile(
      statePath,
      `${JSON.stringify(safeResult)}\n`,
      "utf-8",
    );
  } catch {
    /* The CLI test result is still returned even if local state caching fails. */
  }
  return safeResult;
}

export async function getLastClaudeCliTestForProfile(
  provider: LlmProvider,
  profile: ClaudeProfileSummary,
  configFingerprint: string,
): Promise<ClaudeCliTestResult | null> {
  const lastClaudeCliTest = await readPersistedClaudeCliTest();
  if (!lastClaudeCliTest) return null;
  if (
    lastClaudeCliTest.provider !== provider ||
    lastClaudeCliTest.profileId !== profile.id ||
    lastClaudeCliTest.configFingerprint !== configFingerprint
  ) {
    return {
      checked: false,
      ok: null,
      output: null,
      error: "Test not run for this profile.",
      provider,
      profileId: profile.id,
      configFingerprint,
    };
  }

  return lastClaudeCliTest;
}
