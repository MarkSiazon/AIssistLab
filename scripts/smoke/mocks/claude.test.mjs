import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildMockClaudeCliStatusPayload } from "./claude.mjs";

const defaultPayload = buildMockClaudeCliStatusPayload();

assert.equal(defaultPayload.provider, "anthropic_api");
assert.equal(defaultPayload.enabled, false);
assert.equal(defaultPayload.version, "smoke");
assert.equal(defaultPayload.cliPath, "claude");
assert.equal(defaultPayload.loginCommand, "claude auth login");
assert.equal(defaultPayload.profiles.length, 1);
assert.equal(defaultPayload.selectedProfile.displayPath, "~/.claude");
assert.equal(defaultPayload.selectedProfileFingerprint, "smoke-default-profile");
assert.equal(defaultPayload.auth.loggedIn, true);

const lastCliSmokeTest = {
  checked: true,
  ok: true,
  output: "OK",
  error: null,
  provider: "claude_code_cli",
  profileId: "default",
  configFingerprint: "smoke-default-profile",
};
const localPayload = buildMockClaudeCliStatusPayload(lastCliSmokeTest, {
  provider: "claude_code_cli",
  enabled: true,
  version: "local-smoke",
  displayPath: "~\\.claude",
});

assert.equal(localPayload.provider, "claude_code_cli");
assert.equal(localPayload.enabled, true);
assert.equal(localPayload.version, "local-smoke");
assert.equal(localPayload.selectedProfile.displayPath, "~\\.claude");
assert.equal(localPayload.lastCliSmokeTest, lastCliSmokeTest);

for (const runnerPath of ["scripts/smoke/runners/local.mjs", "scripts/smoke/runners/production.mjs"]) {
  const source = readFileSync(runnerPath, "utf8");
  assert.match(
    source,
    /buildMockClaudeCliStatusPayload/,
    `${runnerPath} should use the shared Claude CLI status fixture builder`,
  );
}

console.log("Claude smoke mock helpers passed");
