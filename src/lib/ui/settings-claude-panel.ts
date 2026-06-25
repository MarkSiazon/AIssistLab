import type { ClaudeProfileSummary } from "@/lib/claude/discovery";
import type { ClaudeCliStatus } from "@/lib/rag/claude-cli-status";
import type { ClaudeCliTestResult } from "@/lib/rag/claude-cli-test-state";
import type { ActiveRuntimeProviderStatus } from "@/lib/settings/runtime-config";

type SettingsClaudePanelTone = "ok" | "warn" | "error" | "neutral";

export type SettingsClaudeProfileSummary = ClaudeProfileSummary;
export type SettingsClaudeCliStatus = ClaudeCliStatus;

export type SettingsClaudeRuntimeStatus = Pick<
  ActiveRuntimeProviderStatus,
  "provider" | "source"
>;

export type SettingsClaudeTestResult = ClaudeCliTestResult;

interface SettingsClaudeStatusCard {
  label: string;
  value: string;
  detail: string;
  tone: SettingsClaudePanelTone;
}

interface SettingsClaudeDetailRow {
  label: string;
  value: string;
  meta: string;
}

interface SettingsClaudeTestPresentation {
  hasRun: boolean;
  label: string;
  tone: SettingsClaudePanelTone;
  alertText: string | null;
}

export interface SettingsClaudePanelState {
  statusCards: SettingsClaudeStatusCard[];
  detailRows: SettingsClaudeDetailRow[];
  test: SettingsClaudeTestPresentation;
}

export interface SettingsClaudePanelInput {
  claudeStatus: SettingsClaudeCliStatus;
  activeRuntime: SettingsClaudeRuntimeStatus | null;
  claudeTestResult: SettingsClaudeTestResult | null;
  testIsCurrent: boolean;
  formatPath: (value: string) => string;
  profileStatusText: (profile: SettingsClaudeProfileSummary) => string;
}

function getTestPresentation({
  result,
  isCurrent,
}: {
  result: SettingsClaudeTestResult | null;
  isCurrent: boolean;
}): SettingsClaudeTestPresentation {
  const hasRun = result?.checked === true && result.ok !== null;
  const label = !result || !hasRun
    ? "Not run"
    : !isCurrent
      ? "Not run for this profile"
      : result.ok
        ? "Passed"
        : "Failed";
  const tone: SettingsClaudePanelTone =
    !result || !hasRun || !isCurrent ? "warn" : result.ok ? "ok" : "error";
  const alertText =
    result && isCurrent && result.error ? `Test: ${label} - ${result.error}` : null;

  return {
    hasRun,
    label,
    tone,
    alertText,
  };
}

export function getSettingsClaudePanelState({
  claudeStatus,
  activeRuntime,
  claudeTestResult,
  testIsCurrent,
  formatPath,
  profileStatusText,
}: SettingsClaudePanelInput): SettingsClaudePanelState {
  const test = getTestPresentation({
    result: claudeTestResult,
    isCurrent: testIsCurrent,
  });

  return {
    test,
    statusCards: [
      {
        label: "Install",
        value: claudeStatus.installed ? "Installed" : "Not found",
        detail: claudeStatus.version
          ? `Version ${claudeStatus.version}`
          : "Local Claude Code executable check.",
        tone: claudeStatus.installed ? "ok" : "error",
      },
      {
        label: "Auth",
        value:
          claudeStatus.auth.loggedIn === true
            ? claudeStatus.auth.method ?? "Signed in"
            : "Not confirmed",
        detail:
          claudeStatus.auth.error ??
          "Status is checked for the selected local profile only.",
        tone: claudeStatus.auth.loggedIn === true ? "ok" : "warn",
      },
      {
        label: "Runtime",
        value: activeRuntime
          ? activeRuntime.provider === "claude_code_cli"
            ? "Claude CLI"
            : "API key"
          : "Not loaded",
        detail: activeRuntime
          ? activeRuntime.source === "runtime"
            ? "Applied for this session"
            : "Using process env"
          : "Refresh runtime status.",
        tone:
          activeRuntime && activeRuntime.provider === claudeStatus.provider
            ? "ok"
            : "warn",
      },
      {
        label: "Smoke test",
        value: test.label,
        detail:
          test.hasRun && testIsCurrent && claudeTestResult?.error
            ? claudeTestResult.error
            : test.hasRun && testIsCurrent && claudeTestResult?.ok
              ? "Claude CLI generation smoke test passed for this profile."
              : "Run Test CLI before relying on local subscription mode.",
        tone: test.tone,
      },
    ],
    detailRows: [
      {
        label: "CLI command",
        value: `${formatPath(claudeStatus.cliPath)}${
          claudeStatus.version ? ` (${claudeStatus.version})` : ""
        }`,
        meta: `Source: ${claudeStatus.cliPathSource}`,
      },
      {
        label: "Configured command",
        value: formatPath(claudeStatus.configuredCliPath),
        meta: "Use auto unless a custom executable is intentional.",
      },
      {
        label: "Login",
        value: claudeStatus.loginHelperAvailable
          ? `Helper (${claudeStatus.loginCommandSource})`
          : claudeStatus.canOpenLogin
            ? "Claude auth login"
            : "Unavailable",
        meta: claudeStatus.canOpenLogin
          ? formatPath(claudeStatus.loginCommand)
          : claudeStatus.enabled
            ? "Install Claude Code CLI before opening login."
            : "Local CLI calls disabled",
      },
      {
        label: "Profile",
        value: `${claudeStatus.selectedProfile.label} (${profileStatusText(
          claudeStatus.selectedProfile,
        )})`,
        meta: claudeStatus.selectedProfile.displayPath,
      },
    ],
  };
}
