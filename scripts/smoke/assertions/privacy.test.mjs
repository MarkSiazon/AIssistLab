import assert from "node:assert/strict";
import {
  assertNoUnsafe,
  privacyScanPattern,
} from "./privacy.mjs";

const privacyScanRegex = new RegExp(privacyScanPattern, "i");

for (const safeValue of [
  "~/.claude-profiles/<profile>",
  ".claude-profiles/<hidden>",
  "ANTHROPIC_API_KEY=[configured]",
  "mdast-util-gfm-task-list-item",
]) {
  assert.doesNotThrow(() => assertNoUnsafe("safe value", safeValue));
  assert.equal(privacyScanRegex.test(safeValue), false);
}

for (const unsafeValue of [
  String.raw`C:\Users\Example\.claude\oauth.json`,
  "owner@example.invalid",
  "~/.claude-profiles/work-profile",
  "Bearer abcdefghijklmnopqrstuvwxyz",
  "sk-general-provider-secret-value",
  "sk-ant-not-a-real-key-but-secret-shaped",
]) {
  assert.throws(() => assertNoUnsafe("unsafe value", unsafeValue));
  assert.equal(privacyScanRegex.test(unsafeValue), true);
}

console.log("Privacy assertion helper tests passed");
