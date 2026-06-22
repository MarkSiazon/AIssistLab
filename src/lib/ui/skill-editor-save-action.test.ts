import assert from "node:assert/strict";

import { buildSkillEditorSaveAction } from "./skill-editor-save-action";

function action(overrides = {}) {
  return buildSkillEditorSaveAction({
    saving: false,
    fieldsReady: true,
    hasUnsavedChanges: true,
    validationErrorCount: 0,
    ...overrides,
  });
}

assert.deepEqual(action({ saving: true }), {
  canSave: false,
  buttonLabel: "Saving...",
  statusLabel: "Saving",
  ariaLabel: "Saving skill",
  helpText: "Saving the skill file and marking the index stale.",
});

assert.deepEqual(
  action({ fieldsReady: false, validationErrorCount: 3 }),
  {
    canSave: false,
    buttonLabel: "Fix fields",
    statusLabel: "Needs fields",
    ariaLabel: "Fix 3 validation issues before saving",
    helpText: "Fix 3 validation issues before saving.",
  },
);

assert.deepEqual(
  action({ fieldsReady: false, validationErrorCount: 1 }),
  {
    canSave: false,
    buttonLabel: "Fix field",
    statusLabel: "Needs field",
    ariaLabel: "Fix 1 validation issue before saving",
    helpText: "Fix 1 validation issue before saving.",
  },
);

assert.deepEqual(action({ hasUnsavedChanges: false }), {
  canSave: false,
  buttonLabel: "No changes",
  statusLabel: "Up to date",
  ariaLabel: "No unsaved changes to save",
  helpText: "The current editor values match the last saved version.",
});

assert.deepEqual(action(), {
  canSave: true,
  buttonLabel: "Save changes",
  statusLabel: "Ready to save",
  ariaLabel: "Save skill changes",
  helpText: "Save will write the skill file and mark the index stale.",
});

console.log("Skill editor save action tests passed");
