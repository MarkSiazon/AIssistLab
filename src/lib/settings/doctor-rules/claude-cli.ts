import type { LlmProvider } from "@/lib/rag/llm-types";
import {
  createDoctorCheck as check,
  type SetupDoctorCheck,
  type SetupDoctorInput,
} from "@/lib/settings/doctor-model";

function buildClaudeCliInstallCheck(
  input: SetupDoctorInput,
  provider: LlmProvider,
): SetupDoctorCheck {
  if (!input.claude.installed) {
    return check(
      "claude-cli-install",
      "cli",
      "Claude CLI install",
      provider === "claude_code_cli" ? "error" : "warn",
      "Claude Code CLI was not found.",
      ["CLAUDE_CLI_PATH"],
      "Install Claude Code, then leave CLAUDE_CLI_PATH=auto unless you intentionally use a different executable.",
    );
  }

  if (input.claude.cliPathSource === "native-install") {
    return check(
      "claude-cli-install",
      "cli",
      "Claude CLI install",
      "ok",
      `Claude Code is installed from the native installer path (${input.claude.version ?? "version unknown"}).`,
      ["CLAUDE_CLI_PATH"],
    );
  }

  return check(
    "claude-cli-install",
    "cli",
    "Claude CLI install",
    provider === "claude_code_cli" ? "warn" : "ok",
    `Claude Code is available through ${input.claude.cliPathSource}.`,
    ["CLAUDE_CLI_PATH"],
    "Use CLAUDE_CLI_PATH=auto to prefer the native installer path when available.",
  );
}

function buildClaudeAuthCheck(
  input: SetupDoctorInput,
  provider: LlmProvider,
): SetupDoctorCheck {
  return input.claude.auth.loggedIn === true
    ? check(
        "claude-auth",
        "cli",
        "Claude CLI auth",
        "ok",
        "Selected Claude profile authentication is confirmed.",
        ["CLAUDE_CONFIG_DIR"],
      )
    : check(
        "claude-auth",
        "cli",
        "Claude CLI auth",
        provider === "claude_code_cli" ? "error" : "warn",
        "Selected Claude profile authentication is not confirmed.",
        ["CLAUDE_CONFIG_DIR"],
        "Use Open Login from Settings for the selected profile, then refresh status.",
      );
}

function buildClaudeProfileCheck(
  input: SetupDoctorInput,
  provider: LlmProvider,
): SetupDoctorCheck {
  if (input.claude.configDirConfigured && !input.claude.selectedProfile.exists) {
    return check(
      "claude-profile-path",
      "cli",
      "Claude profile path",
      provider === "claude_code_cli" ? "error" : "warn",
      "CLAUDE_CONFIG_DIR is selected, but the profile folder was not found.",
      ["CLAUDE_CONFIG_DIR"],
      "Set CLAUDE_CONFIG_DIR to a signed-in discovered profile, or leave it blank for the default profile.",
    );
  }

  if (
    provider === "claude_code_cli" &&
    input.claude.profiles.length > 1 &&
    !input.claude.configDirConfigured
  ) {
    return check(
      "claude-profile-selection",
      "cli",
      "Claude profile selection",
      "warn",
      "Multiple Claude profiles were discovered, but the default profile is selected.",
      ["CLAUDE_CONFIG_DIR"],
      "Set CLAUDE_CONFIG_DIR to a signed-in discovered profile if the default profile cannot generate.",
    );
  }

  return check(
    "claude-profile-selection",
    "cli",
    "Claude profile selection",
    "ok",
    input.claude.configDirConfigured
      ? "A specific Claude profile is selected."
      : "The default Claude profile is selected.",
    ["CLAUDE_CONFIG_DIR"],
  );
}

function buildClaudeSmokeTestCheck(
  input: SetupDoctorInput,
  provider: LlmProvider,
): SetupDoctorCheck {
  const cliTest = input.cliTest ?? {
    checked: false,
    ok: null,
    output: null,
    error: null,
  };

  if (provider !== "claude_code_cli") {
    return check(
      "claude-cli-e2e",
      "cli",
      "Claude CLI smoke test",
      "ok",
      "Claude CLI generation smoke test is only required when Local Claude CLI is selected.",
      ["LLM_PROVIDER", "CLAUDE_CONFIG_DIR"],
    );
  }

  const cliTestMatchesCurrentProfile =
    cliTest.checked &&
    cliTest.provider === provider &&
    cliTest.profileId === input.claude.selectedProfile.id &&
    cliTest.configFingerprint === input.claude.selectedProfileFingerprint;

  if (!cliTest.checked) {
    return check(
      "claude-cli-e2e",
      "cli",
      "Claude CLI smoke test",
      "warn",
      "Claude CLI generation smoke test has not been run.",
      ["LLM_PROVIDER", "CLAUDE_CONFIG_DIR"],
      "Click Test CLI in Settings to verify local generation with the selected profile.",
    );
  }

  if (!cliTestMatchesCurrentProfile) {
    return check(
      "claude-cli-e2e",
      "cli",
      "Claude CLI smoke test",
      "warn",
      "Claude CLI generation smoke test was not run for this profile.",
      ["LLM_PROVIDER", "CLAUDE_CONFIG_DIR"],
      "Click Test CLI in Settings to verify local generation with the selected profile.",
    );
  }

  return cliTest.ok
    ? check(
        "claude-cli-e2e",
        "cli",
        "Claude CLI smoke test",
        "ok",
        "Claude CLI generation smoke test passed.",
        ["LLM_PROVIDER", "CLAUDE_CONFIG_DIR"],
      )
    : check(
        "claude-cli-e2e",
        "cli",
        "Claude CLI smoke test",
        "error",
        `Claude CLI generation smoke test failed: ${cliTest.error ?? "unknown error"}`,
        ["LLM_PROVIDER", "CLAUDE_CONFIG_DIR"],
        "Open Login for the selected profile, or choose a signed-in discovered profile.",
      );
}

export function buildClaudeCliChecks({
  input,
  provider,
}: {
  input: SetupDoctorInput;
  provider: LlmProvider;
}): SetupDoctorCheck[] {
  return [
    buildClaudeCliInstallCheck(input, provider),
    buildClaudeAuthCheck(input, provider),
    buildClaudeProfileCheck(input, provider),
    buildClaudeSmokeTestCheck(input, provider),
  ];
}
