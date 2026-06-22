import assert from "node:assert/strict";

import { buildSkillsImportPreviewRowState } from "./skills-import-preview-row";

assert.deepEqual(
  buildSkillsImportPreviewRowState({
    displayName: "ready-skill.md",
    duplicate: false,
    validationErrors: [],
    qualityWarnings: [],
  }),
  {
    statusLabel: "Ready",
    statusTone: "ok",
    issueSummary: "Ready to import",
    ariaLabel: "ready-skill.md: ready to import",
    visibleIssues: [],
    hiddenIssueCount: 0,
    hiddenIssueMessage: null,
  },
);

assert.deepEqual(
  buildSkillsImportPreviewRowState({
    displayName: "duplicate-skill.md",
    duplicate: true,
    validationErrors: [],
    qualityWarnings: [],
  }),
  {
    statusLabel: "Duplicate",
    statusTone: "warn",
    issueSummary: "Duplicate skill",
    ariaLabel: "duplicate-skill.md: duplicate skill",
    visibleIssues: [],
    hiddenIssueCount: 0,
    hiddenIssueMessage: null,
  },
);

const warningOnly = buildSkillsImportPreviewRowState({
  displayName: "warning-skill.md",
  duplicate: false,
  validationErrors: [],
  qualityWarnings: [
    { message: "Add trigger guidance.", category: "discoverability" },
    { message: "Trim long content." },
  ],
});
assert.equal(warningOnly.statusLabel, "Warning");
assert.equal(warningOnly.statusTone, "warn");
assert.equal(warningOnly.issueSummary, "2 warnings");
assert.equal(warningOnly.ariaLabel, "warning-skill.md: 2 warnings");
assert.deepEqual(warningOnly.visibleIssues, [
  {
    key: "warning:discoverability:Add trigger guidance.",
    tone: "warn",
    message: "discoverability: Add trigger guidance.",
  },
  {
    key: "warning:general:Trim long content.",
    tone: "warn",
    message: "Trim long content.",
  },
]);

const invalidMixed = buildSkillsImportPreviewRowState({
  displayName: "mixed-skill.md",
  duplicate: true,
  validationErrors: [
    { message: "Name is required." },
    { message: "Description is required." },
    { message: "Body is empty." },
  ],
  qualityWarnings: [
    { message: "Add trigger guidance.", category: "discoverability" },
    { message: "Add examples.", category: "maintainability" },
  ],
});
assert.equal(invalidMixed.statusLabel, "Invalid");
assert.equal(invalidMixed.statusTone, "error");
assert.equal(invalidMixed.issueSummary, "3 errors, 2 warnings, duplicate");
assert.equal(
  invalidMixed.ariaLabel,
  "mixed-skill.md: 3 errors, 2 warnings, duplicate",
);
assert.deepEqual(invalidMixed.visibleIssues, [
  { key: "error:Name is required.", tone: "error", message: "Name is required." },
  {
    key: "error:Description is required.",
    tone: "error",
    message: "Description is required.",
  },
  {
    key: "warning:discoverability:Add trigger guidance.",
    tone: "warn",
    message: "discoverability: Add trigger guidance.",
  },
]);
assert.equal(invalidMixed.hiddenIssueCount, 2);
assert.equal(invalidMixed.hiddenIssueMessage, "2 more issues hidden in this compact preview.");

console.log("Skills import preview row tests passed");
