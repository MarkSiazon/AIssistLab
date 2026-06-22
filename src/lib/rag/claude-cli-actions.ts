import { rememberClaudeCliTest, type ClaudeCliTestResult } from "@/lib/rag/claude-cli-test-state";
import { clearClaudeCliStatusCache } from "@/lib/rag/claude-cli-status";
import {
  buildClaudePromptArgs,
  cleanCliFailure,
  commandExists,
  launchVisibleCommand,
  runProcess,
  sanitizeCliOutput,
} from "@/lib/rag/claude-cli-process";
import {
  resolveClaudeProfileSelection,
  type ClaudeProfileSelectionInput,
} from "@/lib/claude/discovery";
import {
  getClaudeCliEnv,
  getClaudeCliTimeoutMs,
  getClaudeConfigDir,
  getLlmProvider,
  profileConfigDir,
  profileFingerprint,
  resolveClaudeCliCommand,
  resolveClaudeLoginCommand,
} from "@/lib/rag/claude-cli-runtime";

interface ClaudeLoginActionDependencies {
  resolveClaudeCliCommand?: typeof resolveClaudeCliCommand;
  resolveClaudeLoginCommand?: typeof resolveClaudeLoginCommand;
  resolveClaudeProfileSelection?: typeof resolveClaudeProfileSelection;
  getClaudeConfigDir?: typeof getClaudeConfigDir;
  getClaudeCliEnv?: typeof getClaudeCliEnv;
  commandExists?: typeof commandExists;
  launchVisibleCommand?: typeof launchVisibleCommand;
}

export async function testClaudeCli(
  selection?: ClaudeProfileSelectionInput,
): Promise<ClaudeCliTestResult> {
  clearClaudeCliStatusCache();
  const resolvedCli = await resolveClaudeCliCommand();
  const selected = await resolveClaudeProfileSelection(selection, {
    configuredConfigDir: getClaudeConfigDir(),
  });
  const provider = getLlmProvider();
  const configFingerprint = profileFingerprint(provider, selected.internalProfile);
  const result = await runProcess(
    resolvedCli.command,
    buildClaudePromptArgs("Reply exactly: OK"),
    {
      env: getClaudeCliEnv(profileConfigDir(selected.internalProfile)),
      timeoutMs: Math.min(getClaudeCliTimeoutMs(), 60_000),
    },
  );

  if (result.timedOut) {
    const remembered = await rememberClaudeCliTest({
      checked: true,
      ok: false,
      output: null,
      error: "Claude CLI timed out before returning a response.",
      provider,
      profileId: selected.publicProfile.id,
      configFingerprint,
    });
    clearClaudeCliStatusCache();
    return remembered;
  }

  if (result.error || result.code !== 0) {
    const remembered = await rememberClaudeCliTest({
      checked: true,
      ok: false,
      output: null,
      error: cleanCliFailure(result),
      provider,
      profileId: selected.publicProfile.id,
      configFingerprint,
    });
    clearClaudeCliStatusCache();
    return remembered;
  }

  const output = sanitizeCliOutput(result.stdout);
  const ok = output.trim() === "OK";
  const remembered = await rememberClaudeCliTest({
    checked: true,
    ok,
    output,
    error: ok ? null : "Claude CLI responded, but did not return the expected OK text.",
    provider,
    profileId: selected.publicProfile.id,
    configFingerprint,
  });
  clearClaudeCliStatusCache();
  return remembered;
}

export async function launchClaudeLogin(
  selection?: ClaudeProfileSelectionInput,
  dependencies: ClaudeLoginActionDependencies = {},
): Promise<{
  ok: boolean;
  loginCommand: string;
  mode: "helper" | "claude-auth";
}> {
  clearClaudeCliStatusCache();
  const resolveCli =
    dependencies.resolveClaudeCliCommand ?? resolveClaudeCliCommand;
  const resolveLogin =
    dependencies.resolveClaudeLoginCommand ?? resolveClaudeLoginCommand;
  const resolveProfile =
    dependencies.resolveClaudeProfileSelection ?? resolveClaudeProfileSelection;
  const readConfigDir = dependencies.getClaudeConfigDir ?? getClaudeConfigDir;
  const buildEnv = dependencies.getClaudeCliEnv ?? getClaudeCliEnv;
  const checkCommandExists = dependencies.commandExists ?? commandExists;
  const launchCommand =
    dependencies.launchVisibleCommand ?? launchVisibleCommand;

  const resolvedCli = await resolveCli();
  const resolvedLogin = await resolveLogin(resolvedCli.command);
  const selected = await resolveProfile(selection, {
    configuredConfigDir: readConfigDir(),
  });
  const env = buildEnv(profileConfigDir(selected.internalProfile));

  if (resolvedLogin.available) {
    launchCommand(resolvedLogin.command, [], env);
    return {
      ok: true,
      loginCommand: resolvedLogin.displayCommand,
      mode: "helper",
    };
  }

  if (!(await checkCommandExists(resolvedCli.command))) {
    throw new Error(
      "Claude login helper was not found, and Claude Code CLI is not installed.",
    );
  }

  launchCommand(resolvedCli.command, ["auth", "login"], env);

  return {
    ok: true,
    loginCommand: `${resolvedCli.displayCommand} auth login`,
    mode: "claude-auth",
  };
}
