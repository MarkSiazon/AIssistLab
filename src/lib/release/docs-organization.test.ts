import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const latestEvidence = readFileSync(
  "docs/v1-release/latest-local-qa-evidence.md",
  "utf8",
);
const qaHistory = readFileSync("docs/v1-release/qa-history.md", "utf8");
const releaseRunbook = readFileSync(
  "docs/v1-release/release-candidate-runbook.md",
  "utf8",
);
const architecture = readFileSync("docs/architecture.md", "utf8");
const readme = readFileSync("README.md", "utf8");
const docsReadme = readFileSync("docs/README.md", "utf8");

const latestEvidenceLines = latestEvidence.trimEnd().split(/\r?\n/);

assert.ok(
  latestEvidenceLines.length <= 80,
  "latest local QA evidence should stay short and current-state only",
);
assert.match(
  latestEvidence,
  /\[qa-history\.md\]\(qa-history\.md\)/,
  "latest QA evidence should point historical detail to qa-history.md",
);
assert.match(
  latestEvidence,
  /\[release-candidate-runbook\.md\]\(release-candidate-runbook\.md\)/,
  "latest QA evidence should point repeatable commands to the runbook",
);
assert.doesNotMatch(
  latestEvidence,
  /Dev V1 Polish Evidence|The current release-package pass|Latest focused checks/,
  "historical detail should not drift back into latest-local-qa-evidence.md",
);

assert.match(qaHistory, /^# QA Evidence History/m);
assert.match(
  qaHistory,
  /Dev V1 Polish Evidence/,
  "detailed historical QA notes should live in qa-history.md",
);
assert.match(
  releaseRunbook,
  /source of truth for command gates and manual external QA/,
  "release runbook should own command gates and manual QA",
);
assert.match(
  releaseRunbook,
  /\[qa-history\.md\]\(qa-history\.md\)/,
  "release runbook should link historical QA evidence separately",
);
assert.match(
  architecture,
  /## Documentation Ownership/,
  "architecture map should document documentation ownership",
);
assert.match(
  readme,
  /\[Architecture map\]\(docs\/architecture\.md\)/,
  "root README should link the architecture map",
);
assert.match(
  docsReadme,
  /\[QA evidence history\]\(v1-release\/qa-history\.md\)/,
  "docs index should expose the QA history file",
);

console.log("Docs organization tests passed");
