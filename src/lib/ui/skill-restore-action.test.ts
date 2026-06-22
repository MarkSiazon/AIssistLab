import assert from "node:assert/strict";

import { buildSkillRestoreActionState } from "./skill-restore-action";

assert.deepEqual(
  buildSkillRestoreActionState({
    skillName: null,
    restoring: false,
  }),
  {
    canRestore: false,
    buttonLabel: "Restore latest",
    ariaLabel: "No deleted skill backup is available to restore",
    statusLabel: "No backup",
    helpText: "Delete a skill before restore is available.",
  },
);

assert.deepEqual(
  buildSkillRestoreActionState({
    skillName: "research-helper",
    restoring: false,
  }),
  {
    canRestore: true,
    buttonLabel: "Restore research-helper",
    ariaLabel: "Restore research-helper from local backup",
    statusLabel: "Backup available",
    helpText:
      "Restores the latest deleted copy only when it will not overwrite a recreated skill.",
  },
);

assert.deepEqual(
  buildSkillRestoreActionState({
    skillName: "research-helper",
    restoring: true,
  }),
  {
    canRestore: false,
    buttonLabel: "Restoring...",
    ariaLabel: "Restoring research-helper from local backup",
    statusLabel: "Restoring",
    helpText: "Restoring from local backup and marking the index stale.",
  },
);

console.log("Skill restore action tests passed");
