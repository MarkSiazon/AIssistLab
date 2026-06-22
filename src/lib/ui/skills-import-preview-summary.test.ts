import assert from "node:assert/strict";

import { buildSkillsImportPreviewSummary } from "./skills-import-preview-summary";

assert.deepEqual(
  buildSkillsImportPreviewSummary({
    totalCount: 0,
    validCount: 0,
    invalidCount: 0,
    duplicateCount: 0,
    warningCount: 0,
  }),
  {
    statusLabel: "Empty preview",
    statusTone: "warn",
    headline: "No importable skills found.",
    detail: "Choose another source or check that the source contains SKILL.md files.",
    nextAction: "Choose another source",
  },
);

assert.deepEqual(
  buildSkillsImportPreviewSummary({
    totalCount: 3,
    validCount: 2,
    invalidCount: 1,
    duplicateCount: 0,
    warningCount: 0,
  }),
  {
    statusLabel: "Needs fixes",
    statusTone: "error",
    headline: "1 skill needs fixes before import.",
    detail: "Fix invalid skill metadata or content, then preview this source again.",
    nextAction: "Fix invalid skills",
  },
);

assert.deepEqual(
  buildSkillsImportPreviewSummary({
    totalCount: 4,
    validCount: 4,
    invalidCount: 0,
    duplicateCount: 2,
    warningCount: 1,
  }),
  {
    statusLabel: "Review",
    statusTone: "warn",
    headline: "4 valid skills found with duplicates and warnings.",
    detail: "Review duplicate handling and warnings before applying this import.",
    nextAction: "Review import choices",
  },
);

assert.deepEqual(
  buildSkillsImportPreviewSummary({
    totalCount: 5,
    validCount: 5,
    invalidCount: 0,
    duplicateCount: 0,
    warningCount: 2,
  }),
  {
    statusLabel: "Review",
    statusTone: "warn",
    headline: "5 valid skills found with warnings.",
    detail: "Review warnings before applying this import.",
    nextAction: "Review warnings",
  },
);

assert.deepEqual(
  buildSkillsImportPreviewSummary({
    totalCount: 1,
    validCount: 1,
    invalidCount: 0,
    duplicateCount: 0,
    warningCount: 0,
  }),
  {
    statusLabel: "Ready",
    statusTone: "ok",
    headline: "1 valid skill is ready to import.",
    detail: "Apply this preview when you are ready. The index will be marked stale.",
    nextAction: "Apply import",
  },
);

assert.deepEqual(
  buildSkillsImportPreviewSummary({
    totalCount: 3,
    validCount: 3,
    invalidCount: 0,
    duplicateCount: 0,
    warningCount: 0,
  }),
  {
    statusLabel: "Ready",
    statusTone: "ok",
    headline: "3 valid skills are ready to import.",
    detail: "Apply this preview when you are ready. The index will be marked stale.",
    nextAction: "Apply import",
  },
);

console.log("Skills import preview summary tests passed");
