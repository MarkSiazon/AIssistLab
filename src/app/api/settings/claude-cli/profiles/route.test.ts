import assert from "node:assert/strict";
import { createClaudeCliProfilesRouteHandlers } from "./handlers";
import type { ClaudeProfileSummary } from "@/lib/claude/discovery";
import type { ClaudeCliStatus } from "@/lib/rag/claude-cli-status";
import {
  localRequest,
  nonLocalRequest,
} from "@/lib/test-utils/request";

const sampleEmail = ["owner", "example.com"].join("@");
const sampleApiKey = ["sk", "ant", "private-test-value"].join("-");
const sampleAuthFile = ["oauth", "json"].join(".");
const sensitiveProfileName = [
  "person",
  "example.com",
  "private-profile",
  "sk",
  "private-test-value",
].join("-");
const rawProfilePath = [
  "C:",
  "Users",
  "Example",
  ".claude-profiles",
  sensitiveProfileName,
].join("\\");
const rawAuthPath = [
  "C:",
  "Users",
  "Example",
  ".claude",
  sampleAuthFile,
].join("\\");

function selectedProfile(): ClaudeProfileSummary {
  return {
    id: "profile-safe-id",
    label: "Profile 1",
    source: "discovered",
    displayPath: rawProfilePath,
    selected: true,
    exists: true,
    auth: {
      checked: true,
      loggedIn: false,
      method: `Account: ${sampleEmail}`,
      error: `${sampleApiKey} ${rawAuthPath}`,
    },
  };
}

function statusPayload(): ClaudeCliStatus {
  const selected = {
    ...selectedProfile(),
    absoluteConfigDir: rawProfilePath,
    envValue: rawProfilePath,
  } as ClaudeProfileSummary;

  return {
    provider: "claude_code_cli",
    enabled: true,
    cliPath: rawProfilePath,
    configuredCliPath: rawProfilePath,
    cliPathSource: "env",
    loginCommand: rawProfilePath,
    loginCommandSource: "env",
    loginHelperAvailable: true,
    canOpenLogin: true,
    configDirConfigured: true,
    installed: true,
    version: "1.0.0",
    profiles: [selected],
    selectedProfile: selected,
    selectedProfileFingerprint: "fingerprint",
    lastCliSmokeTest: null,
    auth: selected.auth,
  };
}

function assertNoPrivateProfileData(value: unknown): void {
  const serialized = JSON.stringify(value);
  const normalized = serialized.replace(/\\\\/g, "\\");
  for (const privateValue of [
    sampleEmail,
    sampleApiKey,
    sampleAuthFile,
    sensitiveProfileName,
    rawProfilePath,
    rawAuthPath,
    "absoluteConfigDir",
    "envValue",
  ]) {
    assert.equal(
      serialized.includes(privateValue),
      false,
      `private value leaked: ${privateValue}`,
    );
  }
  assert.doesNotMatch(normalized, /[A-Z]:[\\/]/i);
  assert.doesNotMatch(normalized, /[\\/](?:Users|home)[\\/]/i);
  assert.doesNotMatch(
    normalized,
    /\.claude-profiles[\\/](?!<hidden>)[^"'\s]+/i,
  );
  assert.doesNotMatch(serialized, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  assert.doesNotMatch(serialized, /sk-[A-Za-z0-9_-]{10,}/i);
}

async function main(): Promise<void> {
  let called = false;
  const handlers = createClaudeCliProfilesRouteHandlers({
    getClaudeCliStatus: async () => {
      called = true;
      return statusPayload();
    },
  });

  const success = await handlers.GET(
    localRequest("/api/settings/claude-cli/profiles"),
  );
  assert.equal(success.status, 200);
  assert.equal(called, true);
  const payload = await success.json();
  assert.deepEqual(Object.keys(payload).sort(), [
    "canOpenLogin",
    "configDirConfigured",
    "loginCommandSource",
    "profiles",
    "selectedProfile",
  ]);
  assert.equal(payload.selectedProfile.label, "Profile 1");
  assert.equal(
    payload.selectedProfile.displayPath,
    "~\\.claude-profiles\\<hidden>",
  );
  assert.equal(payload.selectedProfile.auth.method, "Account: [redacted]");
  assert.equal(
    payload.selectedProfile.auth.error,
    "[redacted-api-key] ~\\.claude\\[redacted-auth-file]",
  );
  assertNoPrivateProfileData(payload);

  called = false;
  const forbidden = await handlers.GET(
    nonLocalRequest("/api/settings/claude-cli/profiles"),
  );
  assert.equal(forbidden.status, 403);
  assert.equal(called, false);

  console.log("Claude CLI profiles route tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
