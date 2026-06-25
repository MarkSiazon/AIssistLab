import assert from "node:assert/strict";
import {
  buildSkillQualitySummary,
  skillLibraryReadinessActionHref,
  skillLibraryStatusColor,
} from "./skills-library-readiness-panel";
import { isSafeInternalActionHref } from "./internal-action-href";
import type { SkillLibraryQualityReport } from "@/lib/skills/library-readiness";

function report(
  totalSkills: number,
  severities: Array<"warn" | "error">,
): SkillLibraryQualityReport {
  return {
    totalSkills,
    issueCount: severities.length,
    issues: severities.map((severity, index) => ({
      skillName: `skill-${index + 1}`,
      code: severity === "error" ? "unsafe_instruction" : "weak_tags",
      category: "discoverability",
      severity,
      message: `${severity} message`,
    })),
  };
}

assert.equal(skillLibraryStatusColor("ready"), "var(--green)");
assert.equal(skillLibraryStatusColor("needs_action"), "var(--yellow)");
assert.equal(skillLibraryStatusColor("blocked"), "var(--red)");

assert.deepEqual(
  {
    "guided-builder": skillLibraryReadinessActionHref("guided-builder"),
    "create-skill": skillLibraryReadinessActionHref("create-skill"),
    "review-quality": skillLibraryReadinessActionHref("review-quality"),
    "export-skills": skillLibraryReadinessActionHref("export-skills"),
    "rebuild-index": skillLibraryReadinessActionHref("rebuild-index"),
    refresh: skillLibraryReadinessActionHref("refresh"),
  },
  {
    "guided-builder": "/editor/guided",
    "create-skill": "/editor",
    "review-quality": "/settings",
    "export-skills": "/export",
    "rebuild-index": null,
    refresh: null,
  },
);

for (const action of [
  "guided-builder",
  "create-skill",
  "review-quality",
  "export-skills",
] as const) {
  assert.equal(
    isSafeInternalActionHref(skillLibraryReadinessActionHref(action) ?? undefined),
    true,
    `${action} should map to a safe internal route`,
  );
}

assert.deepEqual(buildSkillQualitySummary(null), {
  status: "needs_action",
  label: "Checking",
  message: "Skill Quality scan is still loading.",
});

assert.deepEqual(buildSkillQualitySummary(report(0, [])), {
  status: "needs_action",
  label: "No skills checked",
  message: "Create or import a skill before running quality checks.",
});

assert.deepEqual(buildSkillQualitySummary(report(2, ["error", "warn"])), {
  status: "blocked",
  label: "1 error",
  message: "Skill Quality needs review before release.",
});

assert.deepEqual(buildSkillQualitySummary(report(2, ["warn", "warn"])), {
  status: "needs_action",
  label: "2 warnings",
  message: "Skill Quality can be improved for better chat and export results.",
});

assert.deepEqual(buildSkillQualitySummary(report(1, [])), {
  status: "ready",
  label: "Clear",
  message: "Skill Quality checks are clear across 1 skill.",
});

console.log("Skills library readiness panel helper tests passed");
