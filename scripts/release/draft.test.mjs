import assert from "node:assert/strict";
import { buildReleaseDraftReadiness } from "./draft.mjs";

const readyInput = {
  branchLine: "main...origin/main",
  changedFileCount: 0,
  headCommit: "abc123",
  issueNumber: "3",
  issueState: "CLOSED",
  localTagExists: false,
  notesFile: "docs/v1-release/release-notes.md",
  notesFileExists: true,
  originMainCommit: "abc123",
  remoteTagExists: false,
  tag: "v1.0.0",
  title: "Skill Workshop RAG v1.0.0",
};

const ready = buildReleaseDraftReadiness(readyInput);
assert.equal(ready.ok, true);
assert.deepEqual(ready.errors, []);
assert.deepEqual(ready.commands, [
  'git tag -a v1.0.0 -m "Skill Workshop RAG v1.0.0"',
  "git push origin v1.0.0",
  'gh release create v1.0.0 --draft --title "Skill Workshop RAG v1.0.0" --notes-file docs/v1-release/release-notes.md',
]);

const blockedByManualQa = buildReleaseDraftReadiness({
  ...readyInput,
  issueState: "OPEN",
});
assert.equal(blockedByManualQa.ok, false);
assert.match(
  blockedByManualQa.errors.join("\n"),
  /Manual QA issue #3 must be closed/,
);

const blockedByDirtyTree = buildReleaseDraftReadiness({
  ...readyInput,
  changedFileCount: 1,
});
assert.equal(blockedByDirtyTree.ok, false);
assert.match(blockedByDirtyTree.errors.join("\n"), /Working tree must be clean/);

const blockedByWrongBranch = buildReleaseDraftReadiness({
  ...readyInput,
  branchLine: "dev...origin/dev",
});
assert.equal(blockedByWrongBranch.ok, false);
assert.match(
  blockedByWrongBranch.errors.join("\n"),
  /must be created from main/,
);

const blockedByInvalidTag = buildReleaseDraftReadiness({
  ...readyInput,
  tag: "latest",
});
assert.equal(blockedByInvalidTag.ok, false);
assert.match(blockedByInvalidTag.errors.join("\n"), /must look like v1\.0\.0/);

console.log("Release draft guard tests passed");
