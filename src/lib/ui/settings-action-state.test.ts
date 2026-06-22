import assert from "node:assert/strict";
import {
  getFirstRunActionDisabledHint,
  isFirstRunActionDisabled,
  isReleaseSectionActionDisabled,
} from "./settings-action-state";

function main() {
  assert.equal(
    isFirstRunActionDisabled({
      action: "open-chat",
      saving: false,
      indexRebuilding: false,
      claudeTestLoading: false,
      claudeCliInstalled: false,
      profileActionDisabled: false,
    }),
    false,
    "navigation actions should stay enabled by default",
  );

  assert.equal(
    isFirstRunActionDisabled({
      action: "save-settings",
      saving: true,
      indexRebuilding: false,
      claudeTestLoading: false,
      claudeCliInstalled: true,
      profileActionDisabled: false,
    }),
    true,
    "save-settings should be disabled while saving",
  );

  assert.equal(
    getFirstRunActionDisabledHint({
      action: "save-settings",
      saving: true,
      indexRebuilding: false,
      claudeTestLoading: false,
      claudeCliInstalled: true,
      profileActionDisabled: false,
    }),
    "Saving settings now. Try again in a moment.",
    "save-settings disabled hint should explain the active save",
  );

  assert.equal(
    isFirstRunActionDisabled({
      action: "rebuild-index",
      saving: false,
      indexRebuilding: true,
      claudeTestLoading: false,
      claudeCliInstalled: true,
      profileActionDisabled: false,
    }),
    true,
    "rebuild-index should be disabled while rebuilding",
  );

  assert.equal(
    getFirstRunActionDisabledHint({
      action: "rebuild-index",
      saving: false,
      indexRebuilding: true,
      claudeTestLoading: false,
      claudeCliInstalled: true,
      profileActionDisabled: false,
    }),
    "Index rebuild is already running.",
    "rebuild-index disabled hint should explain the active rebuild",
  );

  assert.equal(
    isFirstRunActionDisabled({
      action: "test-cli",
      saving: false,
      indexRebuilding: false,
      claudeTestLoading: false,
      claudeCliInstalled: false,
      profileActionDisabled: false,
    }),
    true,
    "test-cli should be disabled when Claude CLI is not installed",
  );

  assert.equal(
    getFirstRunActionDisabledHint({
      action: "test-cli",
      saving: false,
      indexRebuilding: false,
      claudeTestLoading: false,
      claudeCliInstalled: false,
      profileActionDisabled: false,
    }),
    "Install or enable Claude CLI before testing.",
    "test-cli hint should explain missing CLI installation",
  );

  assert.equal(
    getFirstRunActionDisabledHint({
      action: "test-cli",
      saving: false,
      indexRebuilding: false,
      claudeTestLoading: true,
      claudeCliInstalled: true,
      profileActionDisabled: false,
    }),
    "Testing Claude CLI profile now.",
    "test-cli hint should prefer the active loading state",
  );

  assert.equal(
    getFirstRunActionDisabledHint({
      action: "test-cli",
      saving: false,
      indexRebuilding: false,
      claudeTestLoading: false,
      claudeCliInstalled: true,
      profileActionDisabled: true,
    }),
    "Select a Claude profile before running tests.",
    "test-cli hint should explain invalid profile selection",
  );

  assert.equal(
    getFirstRunActionDisabledHint({
      action: "export-diagnostics",
      saving: false,
      indexRebuilding: false,
      claudeTestLoading: false,
      claudeCliInstalled: true,
      profileActionDisabled: false,
    }),
    null,
    "enabled actions should not render disabled hints",
  );

  assert.equal(
    isReleaseSectionActionDisabled({
      section: { id: "workspace", status: "blocked" },
      saving: true,
      indexRebuilding: false,
    }),
    true,
    "workspace release action should be disabled while saving",
  );

  assert.equal(
    isReleaseSectionActionDisabled({
      section: { id: "provider", status: "blocked" },
      saving: true,
      indexRebuilding: false,
    }),
    true,
    "provider release action should be disabled while saving",
  );

  assert.equal(
    isReleaseSectionActionDisabled({
      section: { id: "index", status: "needs_action" },
      saving: false,
      indexRebuilding: true,
    }),
    true,
    "index release action should be disabled while rebuilding",
  );

  assert.equal(
    isReleaseSectionActionDisabled({
      section: { id: "chat", status: "blocked", actionHref: "/chat" },
      saving: true,
      indexRebuilding: true,
    }),
    false,
    "off-page release actions should not inherit Settings loading states",
  );

  console.log("Settings action-state helper tests passed");
}

main();
