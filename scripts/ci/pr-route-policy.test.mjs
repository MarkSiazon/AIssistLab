import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(".github/workflows/pr-route-policy.yml", "utf8");

assert.match(
  workflow,
  /BASE_REF.*main.*HEAD_REF.*dev/,
  "only dev should be allowed to promote into main",
);
assert.match(
  workflow,
  /BASE_REF.*dev.*HEAD_REF.*main/,
  "the protected main-to-dev synchronization route should be explicit",
);
assert.match(
  workflow,
  /Allowing protected main-to-dev history synchronization/,
  "main-to-dev synchronization should be documented in the gate output",
);
assert.doesNotMatch(
  workflow,
  /main must not be used as a development branch into dev/,
  "the route gate must not block the protected history synchronization required by branch rules",
);

console.log("PR route policy static tests passed");
