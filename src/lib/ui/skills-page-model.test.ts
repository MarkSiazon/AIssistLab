import assert from "node:assert/strict";
import {
  buildImportAppliedMessage,
  buildIndexRebuiltMessage,
  filterSkills,
  getSkillsEmptyStateCopy,
  type SkillSummary,
} from "./skills-page-model";

assert.deepEqual(getSkillsEmptyStateCopy(true), {
  title: "No matching skills",
  message: "Clear the search or adjust the terms to see more of the local library.",
});

assert.equal(getSkillsEmptyStateCopy(false).title, "No skills yet");

const skills: SkillSummary[] = [
  {
    name: "literature-review",
    description: "Review paper notes",
    tags: ["research", "writing"],
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    name: "lab-protocol",
    description: "Prepare experiment steps",
    tags: ["science"],
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
];

assert.deepEqual(filterSkills(skills, ""), skills);
assert.deepEqual(
  filterSkills(skills, "SCIENCE").map((skill) => skill.name),
  ["lab-protocol"],
);
assert.deepEqual(
  filterSkills(skills, "paper").map((skill) => skill.name),
  ["literature-review"],
);
assert.deepEqual(filterSkills(null, "anything"), []);

assert.equal(
  buildIndexRebuiltMessage({ skillCount: 1, chunkCount: 2 }),
  "Index rebuilt with 1 skill and 2 chunks.",
);
assert.equal(
  buildImportAppliedMessage({
    writtenCount: 2,
    skippedCount: 1,
    renamedCount: 3,
  }),
  "Imported 2 skills, skipped 1, renamed 3. Index marked stale.",
);

console.log("Skills page model tests passed");
