import {
  buildClaudePromptArgs,
  cleanCliFailure,
  runProcess,
  sanitizeCliOutput,
} from "@/lib/rag/claude-cli-process";
import {
  getClaudeCliEnv,
  getClaudeCliTimeoutMs,
  resolveClaudeCliCommand,
} from "@/lib/rag/claude-cli-runtime";

export async function runClaudeCliPrompt(
  query: string,
  systemPrompt: string,
): Promise<string> {
  const resolvedCli = await resolveClaudeCliCommand();
  const result = await runProcess(
    resolvedCli.command,
    buildClaudePromptArgs(query, systemPrompt),
    {
      env: getClaudeCliEnv(),
      timeoutMs: getClaudeCliTimeoutMs(),
    },
  );

  if (result.timedOut) {
    throw new Error("Claude CLI timed out before returning a response.");
  }

  if (result.error) {
    throw new Error(`Claude CLI could not start: ${result.error}`);
  }

  if (result.code !== 0) {
    const details = cleanCliFailure(result);
    if (details.includes("unknown option '--safe-mode'")) {
      throw new Error(
        "Claude CLI does not support --safe-mode. Update Claude Code or set CLAUDE_CLI_PATH to a newer claude executable.",
      );
    }
    throw new Error(details || `Claude CLI exited with code ${result.code}.`);
  }

  return sanitizeCliOutput(result.stdout);
}
