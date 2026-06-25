import assert from "node:assert/strict";
import { countLabel, pluralNoun } from "./count-label";

assert.equal(pluralNoun(1, "skill"), "skill");
assert.equal(pluralNoun(2, "skill"), "skills");
assert.equal(pluralNoun(0, "skill"), "skills");
assert.equal(
  pluralNoun(2, "skill quality issue", "skill quality issues"),
  "skill quality issues",
);

assert.equal(countLabel(1, "chunk"), "1 chunk");
assert.equal(countLabel(3, "chunk"), "3 chunks");
assert.equal(
  countLabel(2, "Claude project warning", "Claude project warnings"),
  "2 Claude project warnings",
);

console.log("Count label helper tests passed");
