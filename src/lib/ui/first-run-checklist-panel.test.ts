import assert from "node:assert/strict";
import {
  firstRunActionHelpId,
  firstRunNextStepLabel,
  getFirstRunChecklistSummary,
  shouldShowFirstRunAction,
} from "./first-run-checklist-panel";
import type { FirstRunChecklistItem } from "@/lib/settings/first-run-checklist";

const items: FirstRunChecklistItem[] = [
  {
    id: "workspace",
    label: "Workspace path valid",
    status: "ready",
    statusLabel: "Ready",
    hint: "Workspace is accessible.",
  },
  {
    id: "skills",
    label: "Skills directory valid",
    status: "needs_action",
    statusLabel: "Needs action",
    hint: "Set SKILLS_DIR.",
  },
  {
    id: "diagnostics",
    label: "Diagnostics export",
    status: "optional",
    statusLabel: "Optional",
    hint: "Export diagnostics.",
  },
];

assert.deepEqual(getFirstRunChecklistSummary(items), {
  readyCount: 1,
  needsActionCount: 1,
  totalCount: 3,
  nextItem: items[1],
});

assert.equal(
  getFirstRunChecklistSummary(items.filter((item) => item.status === "ready"))
    .nextItem,
  null,
);

assert.equal(firstRunNextStepLabel("needs_action"), "Next step");
assert.equal(firstRunNextStepLabel("optional"), "Optional final step");
assert.equal(
  firstRunActionHelpId({
    itemId: "auth",
    actionDisabled: false,
    disabledHint: "Install Claude CLI before testing.",
  }),
  undefined,
  "enabled first-run actions should not point aria-describedby at hidden help text",
);
assert.equal(
  firstRunActionHelpId({
    itemId: "auth",
    actionDisabled: true,
    disabledHint: "Install Claude CLI before testing.",
  }),
  "first-run-action-help-auth",
  "disabled first-run actions should expose the rendered help text id",
);
assert.equal(
  firstRunActionHelpId({
    itemId: "auth",
    actionDisabled: true,
    disabledHint: null,
  }),
  undefined,
  "disabled first-run actions without copy should not emit an empty help reference",
);
assert.equal(shouldShowFirstRunAction({ ...items[0], action: "open-chat" }), false);
assert.equal(shouldShowFirstRunAction({ ...items[1], action: "save-settings" }), true);
assert.equal(
  shouldShowFirstRunAction({ ...items[0], id: "chat", action: "open-chat" }),
  true,
);

console.log("First run checklist panel helper tests passed");
