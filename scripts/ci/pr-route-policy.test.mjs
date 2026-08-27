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
  "the direct main-to-dev route should be explicit",
);
assert.match(
  workflow,
  /sync\/main-to-dev-\*/,
  "the route gate should direct maintainers to a checked ancestry sync branch",
);
assert.match(
  workflow,
  /HEAD_REF.*main[\s\S]*exit 1/,
  "direct main-to-dev PRs should fail before their checks consume runner time",
);

console.log("PR route policy static tests passed");
