import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  ".github/workflows/trusted-pr-lifecycle.yml",
  "utf8",
);

assert.match(source, /schedule:[\s\S]*cron: "\*\/10 \* \* \* \*"/);
assert.match(source, /workflow_dispatch:/);
assert.match(source, /checks: read/);

for (const requiredCheck of ["verify-release", "route-policy", "analyze"]) {
  assert.match(
    source,
    new RegExp(`required_checks=\\([^\\n]*${requiredCheck}`),
    `trusted lifecycle must require ${requiredCheck}`,
  );
}

assert.match(
  source,
  /checks_json=.*check-runs\?filter=latest/,
  "catch-up must inspect latest check runs for the current commit",
);
assert.match(
  source,
  /latest_head_sha[\s\S]*latest_head_sha.*current_head_sha/,
  "catch-up must revalidate the PR head immediately before mutation",
);
assert.match(
  source,
  /base_ref.*main.*head_ref.*dev/,
  "catch-up must preserve the dev-to-main promotion route",
);
assert.match(
  source,
  /auto_merge_enabled[\s\S]*already queued for auto-merge/,
  "catch-up must be idempotent for PRs already queued for auto-merge",
);
assert.doesNotMatch(source, /pull_request_target:/);
assert.doesNotMatch(source, /actions\/checkout@/);

console.log("Trusted PR lifecycle static tests passed");
