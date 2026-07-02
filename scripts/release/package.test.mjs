import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildReleaseEvidence,
  formatReleaseEvidenceMarkdown,
  pendingManualGates,
  releaseGateCoverage,
} from "./evidence.mjs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

assert.equal(
  packageJson.scripts["release:evidence"],
  "node scripts/release/evidence.mjs",
);
assert.equal(
  packageJson.scripts["release:prepare"],
  "node scripts/release/prepare.mjs",
);

const evidence = buildReleaseEvidence({
  generatedAt: "2026-06-28T00:00:00.000Z",
  gateResult: "passed",
  gitStatus: "## dev...origin/dev\n M README.md\n?? docs/v1-release/v1-ship-checklist.md",
  commit: "abc1234",
  testFileCount: 164,
});
const markdown = formatReleaseEvidenceMarkdown(evidence);

assert.equal(evidence.automatedGate.result, "passed");
assert.equal(evidence.automatedGate.testFileCount, 164);
assert.equal(evidence.workingTree, "uncommitted changes present");
assert.equal(evidence.changedFileCount, 2);
assert.ok(releaseGateCoverage.includes("privacy scan"));
assert.ok(pendingManualGates.some((gate) => gate.includes("Open Login")));
assert.match(
  markdown,
  /Working tree: uncommitted changes present \(2 changed files; commit before publishing this as a checkpoint\)/,
);
assert.match(markdown, /Manual Gates Still Pending/);
assert.doesNotMatch(markdown, /C:\\Users\\/i);
assert.doesNotMatch(markdown, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
assert.doesNotMatch(markdown, /sk-[A-Za-z0-9._-]+/i);

console.log("Release package helper tests passed");
