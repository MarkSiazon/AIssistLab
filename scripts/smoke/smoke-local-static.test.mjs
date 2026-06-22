import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("scripts/smoke-local.mjs", "utf8");

assert.match(
  source,
  /async function locatorIsDisabled\(locator\)[\s\S]*?locator\s*\.\s*isDisabled\(\{\s*timeout:\s*1000\s*\}\)[\s\S]*?getAttribute\("aria-disabled",\s*\{\s*timeout:\s*1000\s*\}\)/,
  "smoke runner must centralize native and aria-disabled locator checks",
);

const directIsDisabledCalls = source.match(/\.isDisabled\(/g) ?? [];
assert.equal(
  directIsDisabledCalls.length,
  1,
  "smoke runner should use locatorIsDisabled instead of direct isDisabled calls",
);

assert.match(
  source,
  /button\.disabled\s*\|\|\s*button\.getAttribute\("aria-disabled"\)\s*===\s*"true"/,
  "label-based button lookup must ignore aria-disabled buttons",
);

assert.match(
  source,
  /expectText\(page,\s*"Manual external QA"\)/,
  "settings smoke must verify the manual external QA helper is visible",
);

assert.match(
  source,
  /expectText\(page,\s*"npm run qa:manual"\)/,
  "settings smoke must verify the manual external QA command is visible",
);

console.log("Smoke runner static tests passed");
