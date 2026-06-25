import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildMockIndexStatusPayload } from "./index-mocks.mjs";

const ready = buildMockIndexStatusPayload();

assert.equal(ready.status, "ready");
assert.equal(ready.built, true);
assert.equal(ready.builtAt, "2026-06-12T04:00:00.000Z");
assert.equal(ready.skillCount, 1);
assert.equal(ready.chunkCount, 2);
assert.equal(ready.staleReason, null);
assert.equal(ready.workspaceDisplay, "./examples/demo-workspace");
assert.equal(ready.skillsDirDisplay, ".claude/skills");
assert.equal(ready.error, null);

const missing = buildMockIndexStatusPayload({
  status: "missing",
  skillCount: 0,
  chunkCount: 0,
  staleReason: "Smoke empty state has no skills.",
});

assert.equal(missing.status, "missing");
assert.equal(missing.built, false);
assert.equal(missing.builtAt, null);
assert.equal(missing.skillCount, 0);
assert.equal(missing.chunkCount, 0);
assert.equal(missing.staleReason, "Smoke empty state has no skills.");

for (const runnerPath of ["scripts/smoke-local.mjs", "scripts/smoke-production.mjs"]) {
  const source = readFileSync(runnerPath, "utf8");
  assert.match(
    source,
    /buildMockIndexStatusPayload/,
    `${runnerPath} should use the shared index status fixture builder`,
  );
}

console.log("Index smoke mock helpers passed");
