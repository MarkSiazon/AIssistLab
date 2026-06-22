import assert from "node:assert/strict";

import { buildSkillDeleteActionState } from "./skill-delete-action";

assert.deepEqual(
  buildSkillDeleteActionState({
    skillName: "research-helper",
    typedName: "",
    deleting: false,
  }),
  {
    canDelete: false,
    buttonLabel: "Confirm delete",
    ariaLabel: "Type research-helper to confirm deletion",
    blocker: "Type the exact skill name to enable delete.",
  },
);

assert.deepEqual(
  buildSkillDeleteActionState({
    skillName: "research-helper",
    typedName: "research",
    deleting: false,
  }),
  {
    canDelete: false,
    buttonLabel: "Confirm delete",
    ariaLabel: "Type research-helper to confirm deletion",
    blocker: "Typed name does not match research-helper.",
  },
);

assert.deepEqual(
  buildSkillDeleteActionState({
    skillName: "research-helper",
    typedName: "research-helper",
    deleting: false,
  }),
  {
    canDelete: true,
    buttonLabel: "Delete research-helper.md",
    ariaLabel: "Delete research-helper skill file",
    blocker: null,
  },
);

assert.deepEqual(
  buildSkillDeleteActionState({
    skillName: "research-helper",
    typedName: "research-helper",
    deleting: true,
  }),
  {
    canDelete: false,
    buttonLabel: "Deleting...",
    ariaLabel: "Deleting research-helper skill file",
    blocker: "Delete is in progress.",
  },
);

console.log("Skill delete action tests passed");
