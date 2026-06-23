import assert from "node:assert/strict";
import { getSettingsClaudePanelState } from "./settings-claude-panel";

const claudeStatus = {
  provider: "claude_code_cli" as const,
  enabled: true,
  cliPath: "claude",
  configuredCliPath: "auto",
  cliPathSource: "path" as const,
  loginCommand: "claude-login",
  loginCommandSource: "path" as const,
  loginHelperAvailable: true,
  canOpenLogin: true,
  configDirConfigured: true,
  installed: true,
  version: "1.2.3",
  profiles: [],
  selectedProfile: {
    id: "default",
    label: "Default profile",
    source: "default" as const,
    displayPath: "~/.claude",
    selected: true,
    exists: true,
    auth: {
      checked: true,
      loggedIn: true,
      method: "subscription",
      error: null,
    },
  },
  selectedProfileFingerprint: "fingerprint",
  lastCliSmokeTest: null,
  auth: {
    checked: true,
    loggedIn: true,
    method: "subscription",
    error: null,
  },
};

const passed = getSettingsClaudePanelState({
  claudeStatus,
  activeRuntime: {
    provider: "claude_code_cli",
    claudeCliEnabled: true,
    configDirConfigured: true,
    source: "runtime",
  },
  claudeTestResult: {
    checked: true,
    ok: true,
    output: "OK",
    error: null,
  },
  testIsCurrent: true,
  formatPath: (value) => `path:${value}`,
  profileStatusText: () => "Signed in",
});

assert.equal(passed.test.label, "Passed");
assert.equal(passed.test.tone, "ok");
assert.equal(passed.statusCards.length, 4);
assert.equal(passed.statusCards[0].value, "Installed");
assert.equal(passed.statusCards[2].value, "Claude CLI");
assert.equal(passed.detailRows[0].value, "path:claude (1.2.3)");
assert.equal(passed.detailRows[2].meta, "path:claude-login");
assert.equal(passed.detailRows[3].value, "Default profile (Signed in)");

const stale = getSettingsClaudePanelState({
  claudeStatus,
  activeRuntime: {
    provider: "anthropic_api",
    claudeCliEnabled: false,
    configDirConfigured: false,
    source: "process",
  },
  claudeTestResult: {
    checked: true,
    ok: true,
    output: "OK",
    error: null,
  },
  testIsCurrent: false,
  formatPath: (value) => value,
  profileStatusText: () => "Signed in",
});

assert.equal(stale.test.label, "Not run for this profile");
assert.equal(stale.test.tone, "warn");
assert.equal(stale.statusCards[2].tone, "warn");

const missing = getSettingsClaudePanelState({
  claudeStatus: { ...claudeStatus, installed: false, version: null },
  activeRuntime: null,
  claudeTestResult: null,
  testIsCurrent: false,
  formatPath: (value) => value,
  profileStatusText: () => "Signed in",
});

assert.equal(missing.test.label, "Not run");
assert.equal(missing.statusCards[0].tone, "error");
assert.equal(missing.statusCards[2].value, "Not loaded");

const builtinLogin = getSettingsClaudePanelState({
  claudeStatus: {
    ...claudeStatus,
    loginCommand: "~\\.local\\bin\\claude.exe auth login",
    loginCommandSource: "missing",
    loginHelperAvailable: false,
    canOpenLogin: true,
  },
  activeRuntime: {
    provider: "claude_code_cli",
    claudeCliEnabled: true,
    configDirConfigured: true,
    source: "runtime",
  },
  claudeTestResult: null,
  testIsCurrent: false,
  formatPath: (value) => value,
  profileStatusText: () => "Signed in",
});

assert.equal(builtinLogin.detailRows[2].value, "Claude auth login");
assert.equal(
  builtinLogin.detailRows[2].meta,
  "~\\.local\\bin\\claude.exe auth login",
);

console.log("Settings Claude panel helper tests passed");
