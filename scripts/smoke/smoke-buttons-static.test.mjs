import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("scripts/smoke-buttons.mjs", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const verifier = readFileSync("scripts/verify-release.mjs", "utf8");

assert.match(
  source,
  /const routes = \[[\s\S]*"\/settings",[\s\S]*"\/skills",[\s\S]*"\/chat",[\s\S]*"\/export",[\s\S]*"\/editor",[\s\S]*"\/editor\/guided"[\s\S]*\]/,
  "safe button smoke should cover the main app routes",
);

assert.match(
  source,
  /expectedRouteText[\s\S]*Manual QA Evidence[\s\S]*Template Gallery[\s\S]*Guided Skill Builder/,
  "safe button smoke should verify expected app content before clicking buttons",
);
assert.match(
  source,
  /Body excerpt:/,
  "safe button smoke should include a body excerpt when route content is missing",
);

assert.match(
  source,
  /for \(let attempt = 1; attempt <= 3; attempt\+\+\)[\s\S]*getByText\(expectedText, \{ exact: true \}\)[\s\S]*waitFor\(\{ state: "visible", timeout: routeNavigationTimeoutMs \/ 3 \}\)/,
  "safe button smoke should retry expected route text readiness before reading final body text",
);

assert.match(
  source,
  /auditSafeButtonClick[\s\S]*gotoRouteAndExpectText\(page, baseUrl, route\)/,
  "safe button smoke should verify route readiness before each button click reload",
);

for (const requiredSkip of [
  "open login",
  "test cli",
  "choose folder",
  "show",
  "save",
  "delete",
  "rebuild",
  "download",
  "send",
]) {
  assert.equal(
    source.toLowerCase().includes(requiredSkip),
    true,
    `safe button smoke must skip ${requiredSkip}`,
  );
}

assert.match(
  source,
  /ERR_ABORTED[\s\S]*request\.method\(\) === "GET"/,
  "safe button smoke should ignore normal aborted GET requests only",
);

assert.match(
  source,
  /__nextjs_original-stack-frames[\s\S]*ERR_ABORTED/,
  "safe button smoke should ignore aborted Next dev stack-frame requests without hiding app API failures",
);

assert.match(
  source,
  /consoleErrors\.length === 0 && failedRequests\.length === 0/,
  "safe button smoke should fail on console errors or real failed requests",
);

assert.match(
  source,
  /Button was no longer visible after route reload\./,
  "safe button smoke should skip transient controls that disappear before click",
);

assert.equal(
  packageJson.scripts["smoke:buttons"],
  "node scripts/smoke-buttons.mjs",
  "package.json should expose smoke:buttons",
);

assert.match(
  verifier,
  /Safe button smoke[\s\S]*smoke:buttons/,
  "release verifier should run the safe button smoke",
);

console.log("Safe button smoke static tests passed");
