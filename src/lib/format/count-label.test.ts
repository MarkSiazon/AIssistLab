import assert from "node:assert/strict";
import { countLabel } from "./count-label";

assert.equal(countLabel(1, "chunk"), "1 chunk");
assert.equal(countLabel(3, "chunk"), "3 chunks");
assert.equal(countLabel(0, "skill"), "0 skills");
assert.equal(
  countLabel(2, "Claude project warning", "Claude project warnings"),
  "2 Claude project warnings",
);

console.log("Count label helper tests passed");
