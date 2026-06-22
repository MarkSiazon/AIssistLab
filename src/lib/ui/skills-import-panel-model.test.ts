import assert from "node:assert/strict";
import {
  buildSkillsImportStats,
  hiddenPreviewSkillMessage,
  hiddenPreviewWarningMessage,
  importChipClass,
} from "./skills-import-panel-model";

assert.equal(importChipClass("ok"), "skills-import-chip-ok");
assert.equal(importChipClass("warn"), "skills-import-chip-warn");
assert.equal(importChipClass("error"), "skills-import-chip-error");
assert.equal(importChipClass(undefined), "skills-import-chip-ok");

assert.deepEqual(
  buildSkillsImportStats({
    validCount: 2,
    invalidCount: 1,
    duplicateCount: 3,
    warningCount: 4,
  }),
  [
    ["Valid", 2],
    ["Invalid", 1],
    ["Duplicates", 3],
    ["Warnings", 4],
  ],
);

assert.equal(
  hiddenPreviewSkillMessage({ totalCount: 6, visibleCount: 4 }),
  "2 more skills included in this import.",
);
assert.equal(
  hiddenPreviewWarningMessage({ totalCount: 4, visibleCount: 3 }),
  "1 more preview warning hidden.",
);
assert.equal(hiddenPreviewSkillMessage({ totalCount: 3, visibleCount: 3 }), null);

console.log("Skills import panel model tests passed");
