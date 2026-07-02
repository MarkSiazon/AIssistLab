import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildMockExportSkillsPayload,
  buildMockImportApplyPayload,
  buildMockImportPreviewPayload,
  buildMockImportPreviewSkill,
  buildMockSkillTemplatesPayload,
  buildMockSkillQualityPayload,
  buildMockSkillsListPayload,
} from "./skills.mjs";

assert.deepEqual(buildMockSkillQualityPayload(), {
  totalSkills: 1,
  issueCount: 0,
  issues: [],
});

assert.deepEqual(buildMockSkillsListPayload(), {
  skills: [],
  total: 0,
  latestDeleted: null,
});

const exportPayload = buildMockExportSkillsPayload();
assert.equal(exportPayload.skills.length, 1);
assert.equal(exportPayload.skills[0].name, "release-readiness-smoke");
assert.deepEqual(exportPayload.skills[0].tags, ["smoke", "release"]);

const customList = buildMockSkillsListPayload({
  skills: [{ name: "custom-smoke-skill" }],
});
assert.equal(customList.total, 1);
assert.equal(customList.skills[0].name, "custom-smoke-skill");

const previewSkill = buildMockImportPreviewSkill({
  name: "duplicate-smoke-skill",
  qualityWarnings: ["Smoke warning."],
  duplicate: true,
});
assert.deepEqual(previewSkill, {
  name: "duplicate-smoke-skill",
  displayName: "duplicate-smoke-skill.md",
  validationErrors: [],
  qualityWarnings: ["Smoke warning."],
  duplicate: true,
});

assert.deepEqual(
  buildMockImportPreviewPayload({
    previewId: "smoke-preview",
    sourceDisplay: "Smoke source",
    skills: [previewSkill],
    warnings: ["Preview warning."],
  }),
  {
    ok: true,
    previewId: "smoke-preview",
    sourceType: "folder",
    sourceDisplay: "Smoke source",
    skills: [previewSkill],
    warnings: ["Preview warning."],
  },
);

assert.deepEqual(
  buildMockImportApplyPayload({
    renamed: [{ from: "a", to: "b" }],
    written: ["b"],
  }),
  {
    skipped: [],
    renamed: [{ from: "a", to: "b" }],
    written: ["b"],
  },
);

const templatesPayload = buildMockSkillTemplatesPayload();
assert.deepEqual(
  templatesPayload.templates.map((template) => template.id),
  ["reference-skill", "workflow-skill", "learning-rubric"],
);
assert.equal(
  templatesPayload.templates[1].description,
  "Guide a repeated task from intake through verification.",
);

for (const runnerPath of ["scripts/smoke/runners/local.mjs", "scripts/smoke/runners/production.mjs"]) {
  const source = readFileSync(runnerPath, "utf8");
  assert.match(
    source,
    /buildMockSkillQualityPayload/,
    `${runnerPath} should use the shared skill quality fixture builder`,
  );
}

assert.match(
  readFileSync("scripts/smoke/runners/production.mjs", "utf8"),
  /buildMockExportSkillsPayload/,
  "production smoke should use the shared export skills fixture builder",
);
assert.match(
  readFileSync("scripts/smoke/runners/production.mjs", "utf8"),
  /buildMockSkillTemplatesPayload/,
  "production smoke should use the shared skill templates fixture builder",
);
assert.match(
  readFileSync("scripts/smoke/runners/local.mjs", "utf8"),
  /buildMockSkillsListPayload/,
  "local smoke should use the shared skills list fixture builder",
);
assert.match(
  readFileSync("scripts/smoke/runners/local.mjs", "utf8"),
  /buildMockImportPreviewPayload/,
  "local smoke should use the shared import preview fixture builder",
);
assert.match(
  readFileSync("scripts/smoke/runners/local.mjs", "utf8"),
  /buildMockImportApplyPayload/,
  "local smoke should use the shared import apply fixture builder",
);

console.log("Skills smoke mock helpers passed");
