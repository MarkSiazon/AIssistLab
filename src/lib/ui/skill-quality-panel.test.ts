import assert from "node:assert/strict";
import type { SkillQualityReport } from "@/lib/skills/quality";
import { getSkillQualityPanelState } from "./skill-quality-panel";

const cleanReport: SkillQualityReport = {
  totalSkills: 1,
  issueCount: 0,
  issues: [],
};

const cleanState = getSkillQualityPanelState(cleanReport);
assert.equal(cleanState.statusColor, "var(--green)");
assert.equal(cleanState.statusLabel, "No issues");
assert.equal(cleanState.scannedLabel, "1 skill scanned");
assert.deepEqual(cleanState.issues, []);

const warningReport: SkillQualityReport = {
  totalSkills: 2,
  issueCount: 1,
  issues: [
    {
      skillName: "example-skill",
      code: "weak_tags",
      category: "context_cost",
      severity: "warn",
      message: "Add more specific tags.",
    },
  ],
};

const warningState = getSkillQualityPanelState(warningReport);
assert.equal(warningState.statusColor, "var(--yellow)");
assert.equal(warningState.statusLabel, "1 issue");
assert.equal(warningState.scannedLabel, "2 skills scanned");
assert.deepEqual(warningState.issues, [
  {
    key: "example-skill-weak_tags",
    skillName: "example-skill",
    categoryLabel: "context cost",
    severity: "warn",
    message: "Add more specific tags.",
  },
]);

const errorState = getSkillQualityPanelState({
  ...warningReport,
  issueCount: 2,
  issues: [
    ...warningReport.issues,
    {
      skillName: "broken-skill",
      code: "invalid_skill",
      category: "maintainability",
      severity: "error",
      message: "Fix frontmatter.",
    },
  ],
});

assert.equal(errorState.statusColor, "var(--red)");
assert.equal(errorState.statusLabel, "2 issues");

console.log("Skill quality panel helper tests passed");
