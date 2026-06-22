import assert from "node:assert/strict";
import { valuesFromGuidedDraft } from "./useSkillEditorBootstrap";

const values = valuesFromGuidedDraft({
  name: "review-skill",
  body: "## Instructions\nReview the code.",
  frontmatter: {
    description: "Review code changes",
    tags: ["review", "git", 7],
    owner: "local",
  },
});

assert.deepEqual(values, {
  name: "review-skill",
  body: "## Instructions\nReview the code.",
  description: "Review code changes",
  tagsInput: "review, git",
  templateFrontmatter: {
    owner: "local",
  },
});

const empty = valuesFromGuidedDraft({
  frontmatter: null as unknown as Record<string, unknown>,
});

assert.deepEqual(empty, {
  name: undefined,
  body: undefined,
  description: "",
  tagsInput: "",
  templateFrontmatter: {},
});

console.log("Skill editor bootstrap tests passed");
