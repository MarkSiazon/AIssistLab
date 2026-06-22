import assert from "node:assert/strict";

import { buildSkillsImportActionState } from "./skills-import-action";

function base(overrides = {}) {
  return buildSkillsImportActionState({
    hasPreview: true,
    previewOk: true,
    isLoading: false,
    validationErrorCount: 0,
    duplicateCount: 0,
    validCount: 2,
    duplicateStrategy: "skip",
    overwriteConfirmText: "",
    ...overrides,
  });
}

assert.deepEqual(
  base({ hasPreview: false }),
  {
    canApply: false,
    buttonLabel: "Apply Import",
    blocker: null,
    requiresOverwriteConfirmation: false,
  },
);

assert.equal(base({ isLoading: true }).canApply, false);
assert.equal(base({ isLoading: true }).buttonLabel, "Applying...");
assert.match(base({ validationErrorCount: 1 }).blocker ?? "", /Fix invalid skills/i);
assert.match(base({ previewOk: false }).blocker ?? "", /cannot be applied/i);

const allSkipped = base({ duplicateCount: 2, validCount: 2, duplicateStrategy: "skip" });
assert.equal(allSkipped.canApply, false);
assert.equal(allSkipped.buttonLabel, "Import non-duplicates");
assert.match(allSkipped.blocker ?? "", /All previewed skills are duplicates/i);

const partialSkip = base({ duplicateCount: 1, validCount: 3, duplicateStrategy: "skip" });
assert.equal(partialSkip.canApply, true);
assert.equal(partialSkip.buttonLabel, "Import 2, skip 1 duplicate");
assert.equal(partialSkip.blocker, null);

const rename = base({ duplicateCount: 2, validCount: 3, duplicateStrategy: "rename" });
assert.equal(rename.canApply, true);
assert.equal(rename.buttonLabel, "Rename duplicates and import 3");

const overwriteBlocked = base({
  duplicateCount: 1,
  duplicateStrategy: "overwrite",
  overwriteConfirmText: "",
});
assert.equal(overwriteBlocked.requiresOverwriteConfirmation, true);
assert.equal(overwriteBlocked.canApply, false);
assert.equal(overwriteBlocked.buttonLabel, "Overwrite and import 2");
assert.match(overwriteBlocked.blocker ?? "", /Type overwrite/i);

const overwriteConfirmed = base({
  duplicateCount: 1,
  duplicateStrategy: "overwrite",
  overwriteConfirmText: " overwrite ",
});
assert.equal(overwriteConfirmed.canApply, true);
assert.equal(overwriteConfirmed.blocker, null);

console.log("Skills import action helper tests passed");
