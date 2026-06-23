import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  clearRuntimeProviderSettings,
} from "@/lib/settings/runtime-config";
import {
  resolveClaudeCliCommand,
  resolveClaudeLoginCommand,
} from "./claude-cli-runtime";

async function main(): Promise<void> {
  const originalLoginCommand = process.env.CLAUDE_LOGIN_COMMAND;
  const originalCliPath = process.env.CLAUDE_CLI_PATH;
  clearRuntimeProviderSettings();
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "claude-cli-runtime-"));

  try {
    const cliBinDir = path.join(tempRoot, "bin");
    await fs.mkdir(cliBinDir, { recursive: true });
    const expectedExecutable = path.join(
      cliBinDir,
      process.platform === "win32" ? "claude.exe" : "claude",
    );
    await fs.writeFile(expectedExecutable, "", "utf8");

    process.env.CLAUDE_CLI_PATH = cliBinDir;
    const resolvedCli = await resolveClaudeCliCommand();
    assert.equal(resolvedCli.command, expectedExecutable);
    assert.equal(resolvedCli.source, "env");
    assert.equal(
      resolvedCli.displayCommand.endsWith(
        process.platform === "win32" ? "\\bin\\claude.exe" : "/bin/claude",
      ),
      true,
    );

    process.env.CLAUDE_LOGIN_COMMAND = "auto";
    const nativeClaude = "C:\\Users\\Example\\.local\\bin\\claude.exe";
    const resolved = await resolveClaudeLoginCommand(nativeClaude);

    assert.equal(resolved.available, false);
    assert.equal(resolved.source, "missing");
    assert.equal(resolved.command, nativeClaude);
    assert.equal(
      resolved.displayCommand,
      "~\\.local\\bin\\claude.exe auth login",
    );
    assert.equal(resolved.configuredLoginCommand, "auto");
  } finally {
    if (originalLoginCommand === undefined) {
      delete process.env.CLAUDE_LOGIN_COMMAND;
    } else {
      process.env.CLAUDE_LOGIN_COMMAND = originalLoginCommand;
    }
    if (originalCliPath === undefined) {
      delete process.env.CLAUDE_CLI_PATH;
    } else {
      process.env.CLAUDE_CLI_PATH = originalCliPath;
    }
    clearRuntimeProviderSettings();
    await fs.rm(tempRoot, { recursive: true, force: true });
  }

  console.log("Claude CLI runtime tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
