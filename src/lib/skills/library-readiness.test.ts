import assert from "node:assert/strict";
import { buildSkillLibraryReadiness } from "./library-readiness";

function readyIndex() {
  return {
    status: "ready" as const,
    skillCount: 3,
    chunkCount: 12,
    staleReason: null,
    error: null,
  };
}

function cleanQuality() {
  return {
    totalSkills: 3,
    issueCount: 0,
    issues: [],
  };
}

async function main() {
  const loading = buildSkillLibraryReadiness({
    totalSkills: null,
    skillsStatus: "loading",
    indexStatus: null,
    qualityReport: null,
  });
  assert.equal(loading.status, "needs_action");
  assert.equal(loading.action, "refresh");
  assert.match(loading.message, /still loading/);

  const loadError = buildSkillLibraryReadiness({
    totalSkills: null,
    skillsStatus: "error",
    skillsError: "Skills directory is unavailable.",
    indexStatus: null,
    qualityReport: null,
  });
  assert.equal(loadError.status, "blocked");
  assert.equal(loadError.action, "refresh");
  assert.match(loadError.message, /unavailable/);

  const ready = buildSkillLibraryReadiness({
    totalSkills: 3,
    skillsStatus: "ready",
    indexStatus: readyIndex(),
    qualityReport: cleanQuality(),
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.statusLabel, "Ready");
  assert.equal(ready.action, "export-skills");
  assert.equal(ready.indexedSkillCount, 3);
  assert.equal(ready.chunkCount, 12);

  const empty = buildSkillLibraryReadiness({
    totalSkills: 0,
    skillsStatus: "ready",
    indexStatus: readyIndex(),
    qualityReport: {
      totalSkills: 0,
      issueCount: 0,
      issues: [],
    },
  });
  assert.equal(empty.status, "blocked");
  assert.equal(empty.action, "guided-builder");
  assert.equal(empty.actionLabel, "Guided Builder");
  assert.equal(empty.indexedSkillCount, 0);
  assert.equal(empty.chunkCount, 0);

  const stale = buildSkillLibraryReadiness({
    totalSkills: 2,
    skillsStatus: "ready",
    indexStatus: {
      status: "stale",
      skillCount: 2,
      chunkCount: 8,
      staleReason: "Skill files changed after the last index build.",
      error: null,
    },
    qualityReport: cleanQuality(),
  });
  assert.equal(stale.status, "needs_action");
  assert.equal(stale.action, "rebuild-index");
  assert.match(stale.message, /Skill files changed/);

  const rebuilding = buildSkillLibraryReadiness({
    totalSkills: 2,
    skillsStatus: "ready",
    indexStatus: {
      status: "rebuilding",
      skillCount: 2,
      chunkCount: 8,
      staleReason: null,
      error: null,
    },
    qualityReport: cleanQuality(),
  });
  assert.equal(rebuilding.status, "needs_action");
  assert.equal(rebuilding.action, "rebuild-index");
  assert.equal(rebuilding.actionLabel, "Rebuilding...");

  const failed = buildSkillLibraryReadiness({
    totalSkills: 2,
    skillsStatus: "ready",
    indexStatus: {
      status: "failed",
      skillCount: 0,
      chunkCount: 0,
      staleReason: null,
      error: "Unable to read skills directory.",
    },
    qualityReport: cleanQuality(),
  });
  assert.equal(failed.status, "blocked");
  assert.equal(failed.action, "rebuild-index");
  assert.match(failed.message, /Unable to read/);

  const qualityWarnings = buildSkillLibraryReadiness({
    totalSkills: 2,
    skillsStatus: "ready",
    indexStatus: readyIndex(),
    qualityReport: {
      totalSkills: 2,
      issueCount: 1,
      issues: [
        {
          skillName: "alpha",
          code: "missing_trigger_example",
          severity: "warn",
          category: "discoverability",
          message: "Missing trigger guidance.",
        },
      ],
    },
  });
  assert.equal(qualityWarnings.status, "needs_action");
  assert.equal(qualityWarnings.action, "review-quality");
  assert.equal(qualityWarnings.warningCount, 1);
  assert.equal(
    qualityWarnings.message,
    "Review 1 skill quality warning to improve chat and export quality.",
  );

  const qualityErrors = buildSkillLibraryReadiness({
    totalSkills: 2,
    skillsStatus: "ready",
    indexStatus: readyIndex(),
    qualityReport: {
      totalSkills: 2,
      issueCount: 1,
      issues: [
        {
          skillName: "alpha",
          code: "unsafe_instruction",
          severity: "error",
          category: "safety",
          message: "Unsafe instruction.",
        },
      ],
    },
  });
  assert.equal(qualityErrors.status, "blocked");
  assert.equal(qualityErrors.errorCount, 1);
  assert.equal(
    qualityErrors.message,
    "Review 1 skill quality error before release.",
  );

  console.log("Skill library readiness tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
