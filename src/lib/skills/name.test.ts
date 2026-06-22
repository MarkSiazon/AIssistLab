import assert from "node:assert/strict";
import { isManagedSkillName } from "./name";

assert.equal(isManagedSkillName("review-helper"), true);
assert.equal(isManagedSkillName("a"), true);
assert.equal(isManagedSkillName("1-skill"), true);
assert.equal(isManagedSkillName("name with spaces"), false);
assert.equal(isManagedSkillName("alpha,beta"), false);
assert.equal(isManagedSkillName("../secret"), false);
assert.equal(isManagedSkillName("-bad"), false);
assert.equal(isManagedSkillName("bad-"), false);

console.log("Skill name tests passed");
