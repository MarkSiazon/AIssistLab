import assert from "node:assert/strict";
import { getSettingsClaudeProfileFieldState } from "./settings-claude-profile-field";

const profiles = [
  {
    id: "default",
    label: "Default profile",
    displayPath: "~\\.claude",
    selected: true,
    exists: true,
    source: "default" as const,
    auth: {
      checked: true,
      loggedIn: true,
      method: "subscription",
      error: null,
    },
  },
  {
    id: "profile-2",
    label: "Profile 2",
    displayPath: "~\\.claude-profiles\\<hidden>",
    selected: false,
    exists: true,
    source: "discovered" as const,
    auth: {
      checked: true,
      loggedIn: false,
      method: null,
      error: "Not signed in",
    },
  },
];

const selectedState = getSettingsClaudeProfileFieldState({
  profiles,
  selectedProfile: profiles[0],
  selectedProfileId: "profile-2",
  manualPath: "",
  testResult: {
    checked: true,
    ok: false,
    output: null,
    error: "Auth failed",
  },
  testIsCurrent: true,
});

assert.equal(selectedState.isManual, false);
assert.equal(selectedState.selectValue, "profile-2");
assert.equal(selectedState.summaryLabel, "Profile 2");
assert.equal(selectedState.summaryStatus, "Not signed in");
assert.equal(selectedState.summaryPath, "~\\.claude-profiles\\<hidden>");
assert.equal(selectedState.summaryColor, "var(--yellow)");
assert.deepEqual(
  selectedState.options.map((option) => option.label),
  ["Default profile - Signed in", "Profile 2 - Not signed in"],
);
assert.deepEqual(selectedState.test, {
  label: "Test failed",
  detail: ": Auth failed",
  color: "var(--yellow)",
});

const manualState = getSettingsClaudeProfileFieldState({
  profiles,
  selectedProfile: profiles[0],
  selectedProfileId: "manual",
  manualPath: "",
  testResult: selectedState.testResult,
  testIsCurrent: false,
});

assert.equal(manualState.isManual, true);
assert.equal(manualState.selectValue, "__manual__");
assert.equal(manualState.summaryLabel, "Manual path");
assert.equal(manualState.summaryStatus, "Not checked");
assert.equal(manualState.summaryPath, "No manual path selected");
assert.equal(manualState.summaryColor, "var(--text-muted)");
assert.equal(manualState.test?.label, "Test not run for this profile");
assert.equal(manualState.test?.detail, "");

const emptyState = getSettingsClaudeProfileFieldState({
  profiles: [],
  selectedProfile: undefined,
  selectedProfileId: "",
  manualPath: "",
  testResult: null,
  testIsCurrent: false,
});

assert.equal(emptyState.selectValue, "default");
assert.deepEqual(emptyState.options, [
  {
    value: "",
    label: "Default profile - Not checked",
  },
]);
assert.equal(emptyState.test, null);

console.log("Settings Claude profile field helper tests passed");
