import assert from "node:assert/strict";
import {
  buildSkillEditorSetupChecks,
  extraFrontmatterFields,
  validateClientSkill,
} from "./skill-editor-model";

assert.deepEqual(extraFrontmatterFields({ description: "x", tags: ["a"], a: 1 }), {
  a: 1,
});

assert.deepEqual(
  validateClientSkill({
    name: "bad name",
    description: "",
    tags: ["Git", "git"],
    body: "",
  }).map((item) => item.code),
  ["invalid_name", "missing_description", "empty_body", "duplicate_tags"],
);

assert.deepEqual(
  buildSkillEditorSetupChecks({
    validationErrors: [],
    name: "review-helper",
    description: "Use this for reviews.",
    parsedTags: ["review"],
    body: "## Instructions\nReview the code.",
  }).map((item) => [item.id, item.ready, item.message]),
  [
    ["name", true, "Valid local file name."],
    ["description", true, "Invocation guidance is present."],
    ["body", true, "2 lines drafted."],
    ["tags", true, "1 tag added."],
  ],
);

assert.equal(
  buildSkillEditorSetupChecks({
    validationErrors: [{ field: "name", code: "invalid_name", message: "bad" }],
    name: "",
    description: "",
    parsedTags: [],
    body: "",
  })[0]?.ready,
  false,
);

console.log("Skill editor model tests passed");
