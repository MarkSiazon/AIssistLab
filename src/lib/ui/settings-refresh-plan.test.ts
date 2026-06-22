import assert from "node:assert/strict";
import {
  getSettingsRefreshTasks,
  runSettingsRefreshPlan,
  type SettingsRefreshTask,
} from "./settings-refresh-plan";

function makeActions(calls: string[]) {
  const action = (name: SettingsRefreshTask) => () => calls.push(name);
  return {
    settings: action("settings"),
    index: action("index"),
    claude: action("claude"),
    doctor: action("doctor"),
    runtime: action("runtime"),
    chat: action("chat"),
    quality: action("quality"),
    release: action("release"),
  };
}

function main() {
  assert.deepEqual(
    getSettingsRefreshTasks("initial"),
    [
      "settings",
      "index",
      "claude",
      "doctor",
      "runtime",
      "chat",
      "quality",
      "release",
    ],
    "initial refresh should load every Settings readiness source",
  );

  assert.deepEqual(
    getSettingsRefreshTasks("after-settings-save"),
    ["doctor", "claude", "runtime", "chat", "release"],
    "settings save should refresh provider/readiness state without reloading index or skill quality",
  );

  assert.deepEqual(
    getSettingsRefreshTasks("manual-refresh"),
    ["doctor", "claude", "runtime", "index", "chat", "quality", "release"],
    "manual refresh should reload all sidebar status sources except raw settings env",
  );

  assert.deepEqual(
    getSettingsRefreshTasks("after-cli-test-failure"),
    ["doctor", "chat", "release"],
    "failed CLI smoke tests should not overwrite the displayed test result by reloading Claude status",
  );

  assert.deepEqual(
    getSettingsRefreshTasks("claude-panel-refresh"),
    ["claude", "runtime"],
    "Claude panel refresh should stay focused on Claude and active runtime state",
  );

  const calls: string[] = [];
  runSettingsRefreshPlan("after-claude-login", makeActions(calls));
  assert.deepEqual(
    calls,
    ["claude", "doctor", "chat", "release"],
    "refresh runner should call plan tasks in deterministic order",
  );

  const missingActionCalls: string[] = [];
  runSettingsRefreshPlan("after-index-rebuild", {
    doctor: () => missingActionCalls.push("doctor"),
    release: () => missingActionCalls.push("release"),
  });
  assert.deepEqual(
    missingActionCalls,
    ["doctor", "release"],
    "refresh runner should tolerate omitted actions for isolated tests",
  );

  console.log("Settings refresh plan tests passed");
}

main();
