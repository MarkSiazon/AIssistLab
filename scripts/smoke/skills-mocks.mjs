export function buildMockSkillQualityPayload({
  totalSkills = 1,
  issueCount = 0,
  issues = [],
} = {}) {
  return {
    totalSkills,
    issueCount,
    issues,
  };
}

export function buildMockSkillsListPayload({
  skills = [],
  total = skills.length,
  latestDeleted = null,
} = {}) {
  return {
    skills,
    total,
    latestDeleted,
  };
}

export function buildMockExportSkillsPayload({
  name = "release-readiness-smoke",
  description = "Production smoke export fixture.",
  tags = ["smoke", "release"],
  updatedAt = "2026-06-12T04:00:00.000Z",
} = {}) {
  return {
    skills: [
      {
        name,
        description,
        tags,
        updatedAt,
      },
    ],
  };
}

export function buildMockImportPreviewSkill({
  name,
  displayName = `${name}.md`,
  validationErrors = [],
  qualityWarnings = [],
  duplicate = false,
} = {}) {
  return {
    name,
    displayName,
    validationErrors,
    qualityWarnings,
    duplicate,
  };
}

export function buildMockImportPreviewPayload({
  previewId,
  sourceType = "folder",
  sourceDisplay,
  skills,
  warnings = [],
}) {
  return {
    ok: true,
    previewId,
    sourceType,
    sourceDisplay,
    skills,
    warnings,
  };
}

export function buildMockImportApplyPayload({
  skipped = [],
  renamed = [],
  written = [],
} = {}) {
  return {
    skipped,
    renamed,
    written,
  };
}

export function buildMockSkillTemplatesPayload({
  templates = [
    {
      id: "reference-skill",
      label: "Reference Skill",
      description: "Capture stable reference material with clear lookup guidance.",
      category: "reference",
      initialFrontmatter: {
        description: "Reference facts and examples for a focused topic.",
        tags: ["reference"],
      },
      initialBody: [
        "## Purpose",
        "",
        "Use this skill when the user needs reliable reference material.",
        "",
      ].join("\n"),
    },
    {
      id: "workflow-skill",
      label: "Workflow Skill",
      description: "Guide a repeated task from intake through verification.",
      category: "workflow",
      initialFrontmatter: {
        description: "Step-by-step workflow for completing a repeated task.",
        tags: ["workflow"],
      },
      initialBody: [
        "## Intake",
        "",
        "- Confirm the target files and expected output.",
        "",
        "## Verification",
        "",
        "- Run the documented checks.",
        "",
      ].join("\n"),
    },
    {
      id: "learning-rubric",
      label: "Learning And Rubric Skill",
      description: "Coach a user through learning with prompts and rubric feedback.",
      category: "learning",
      initialFrontmatter: {
        description: "Guide learning through prompts and rubric feedback.",
        tags: ["learning", "rubric"],
      },
      initialBody: "## Learning Goal\n\nCoach the user through the concept.\n",
    },
  ],
} = {}) {
  return { templates };
}
