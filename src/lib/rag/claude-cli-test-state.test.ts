import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  getLastClaudeCliTest,
  getLastClaudeCliTestForProfile,
  normalizeClaudeCliTestResult,
  rememberClaudeCliTest,
  type ClaudeCliTestResult,
} from "./claude-cli-test-state";

async function main() {
  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "claude-cli-test-state-"),
  );
  process.env.CLAUDE_CLI_TEST_STATE_PATH = path.join(tempDir, "state.json");

  const safeResult: ClaudeCliTestResult = {
    checked: true,
    ok: true,
    output: "OK",
    error: null,
    provider: "claude_code_cli",
    profileId: "default",
    configFingerprint: "fingerprint-a",
  };

  const normalized = normalizeClaudeCliTestResult({
    ...safeResult,
    output: "OK sk-ant-private-value",
    error: "Email owner@example.com token sk-ant-private-value",
  });
  assert.equal(normalized?.output?.includes("sk-ant-private-value"), false);
  assert.equal(normalized?.error?.includes("owner@example.com"), false);

  await rememberClaudeCliTest(safeResult);
  assert.deepEqual(getLastClaudeCliTest(), safeResult);

  const matching = await getLastClaudeCliTestForProfile(
    "claude_code_cli",
    {
      id: "default",
      label: "Default profile",
      source: "default",
      displayPath: "~\\.claude",
      selected: true,
      exists: true,
      auth: {
        checked: false,
        loggedIn: null,
        method: null,
        error: null,
      },
    },
    "fingerprint-a",
  );
  assert.deepEqual(matching, safeResult);

  const stale = await getLastClaudeCliTestForProfile(
    "claude_code_cli",
    {
      id: "profile-2",
      label: "Profile 2",
      source: "discovered",
      displayPath: "~\\.claude-profiles\\<hidden>",
      selected: true,
      exists: true,
      auth: {
        checked: false,
        loggedIn: null,
        method: null,
        error: null,
      },
    },
    "fingerprint-b",
  );
  assert.equal(stale?.checked, false);
  assert.equal(stale?.error, "Test not run for this profile.");

  await fs.rm(tempDir, { recursive: true, force: true });
  delete process.env.CLAUDE_CLI_TEST_STATE_PATH;

  console.log("Claude CLI test-state tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
