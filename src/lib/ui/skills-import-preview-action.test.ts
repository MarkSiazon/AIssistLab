import assert from "node:assert/strict";

import { buildSkillsImportPreviewActionState } from "./skills-import-preview-action";

assert.deepEqual(
  buildSkillsImportPreviewActionState({
    sourceType: "folder",
    hasSource: false,
    isLoading: false,
    hasPreview: false,
  }),
  {
    canPreview: false,
    buttonLabel: "Preview Folder",
    ariaLabel: "Enter a local folder path before previewing import",
    readinessMessage: "Enter a local folder path before preview.",
    readinessTone: "needs-action",
  },
);

assert.deepEqual(
  buildSkillsImportPreviewActionState({
    sourceType: "archive",
    hasSource: false,
    isLoading: false,
    hasPreview: false,
  }),
  {
    canPreview: false,
    buttonLabel: "Preview Zip",
    ariaLabel: "Choose a zip archive before previewing import",
    readinessMessage: "Choose a zip archive before preview.",
    readinessTone: "needs-action",
  },
);

assert.deepEqual(
  buildSkillsImportPreviewActionState({
    sourceType: "github",
    hasSource: false,
    isLoading: false,
    hasPreview: false,
  }),
  {
    canPreview: false,
    buttonLabel: "Preview GitHub",
    ariaLabel: "Enter a public GitHub URL before previewing import",
    readinessMessage: "Enter a public GitHub URL before preview.",
    readinessTone: "needs-action",
  },
);

const readyFolder = buildSkillsImportPreviewActionState({
  sourceType: "folder",
  hasSource: true,
  isLoading: false,
  hasPreview: false,
});
assert.equal(readyFolder.canPreview, true);
assert.equal(readyFolder.buttonLabel, "Preview Folder");
assert.equal(readyFolder.ariaLabel, "Preview local folder import without writing files");
assert.equal(readyFolder.readinessMessage, "Ready to preview. No files will be written.");
assert.equal(readyFolder.readinessTone, "ready");

const readyArchive = buildSkillsImportPreviewActionState({
  sourceType: "archive",
  hasSource: true,
  isLoading: false,
  hasPreview: false,
});
assert.equal(readyArchive.buttonLabel, "Preview Zip");
assert.equal(readyArchive.ariaLabel, "Preview zip archive import without writing files");

const readyGithub = buildSkillsImportPreviewActionState({
  sourceType: "github",
  hasSource: true,
  isLoading: false,
  hasPreview: false,
});
assert.equal(readyGithub.buttonLabel, "Preview GitHub");
assert.equal(readyGithub.ariaLabel, "Preview GitHub import without writing files");

const loading = buildSkillsImportPreviewActionState({
  sourceType: "github",
  hasSource: true,
  isLoading: true,
  hasPreview: false,
});
assert.equal(loading.canPreview, false);
assert.equal(loading.buttonLabel, "Checking...");
assert.equal(loading.ariaLabel, "Checking import source");
assert.equal(loading.readinessMessage, "Checking source. No files are being written.");
assert.equal(loading.readinessTone, "checking");

const previewReady = buildSkillsImportPreviewActionState({
  sourceType: "folder",
  hasSource: true,
  isLoading: false,
  hasPreview: true,
});
assert.equal(
  previewReady.readinessMessage,
  "Preview ready. Review results, duplicates, and warnings before applying.",
);
assert.equal(previewReady.readinessTone, "ready");

console.log("Skills import preview action helper tests passed");
