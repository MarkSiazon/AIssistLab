import assert from "node:assert/strict";

async function main() {
  const validation = await import("./validation");

  assert.equal(validation.isSafeSkillName("review-helper"), true);
  assert.equal(validation.isSafeSkillName("../secrets"), false);
  assert.equal(validation.isSafeSkillName("bad/name"), false);
  assert.equal(validation.isSafeSkillName("-bad"), false);

  const valid = validation.validateSkillInput({
    name: "review-helper",
    frontmatter: {
      description: "Helps review pull requests.",
      tags: ["review", "git"],
    },
    body: "## Instructions\n\nReview the change and report findings.",
  });
  assert.equal(valid.ok, true);
  assert.deepEqual(valid.errors, []);

  const invalid = validation.validateSkillInput({
    name: "../secrets",
    frontmatter: {
      description: "",
      tags: ["review", "Review", "  "],
    },
    body: "  ",
  });
  assert.equal(invalid.ok, false);
  assert.deepEqual(
    invalid.errors.map((item) => item.code),
    [
      "invalid_name",
      "missing_description",
      "empty_body",
      "duplicate_tags",
    ],
  );

  const oversized = validation.validateSkillInput({
    name: "large-skill",
    frontmatter: {
      description: "Too large.",
      tags: [],
    },
    body: "x".repeat(validation.MAX_SKILL_BODY_BYTES + 1),
  });
  assert.equal(
    oversized.errors.some((item) => item.code === "body_too_large"),
    true,
  );

  const officialFrontmatter = validation.validateSkillInput({
    name: "official-style",
    frontmatter: {
      description: "Uses official-style Claude skill metadata.",
      tags: ["official"],
      name: "Official Style",
      when_to_use: "Use when the user asks for a checked workflow.",
      "argument-hint": "[ticket-id]",
      arguments: [{ name: "ticket-id", required: true }],
      "disable-model-invocation": false,
      "user-invocable": true,
      "allowed-tools": ["Read", "Grep"],
      "disallowed-tools": ["Bash(rm*)"],
      model: "sonnet",
      effort: "medium",
      context: ["docs/*.md"],
      agent: "reviewer",
      hooks: ["pre-save"],
      paths: ["docs"],
      shell: { command: "npm test", timeout: 120000 },
    },
    body: "## Instructions\n\nUse the metadata fields without validation errors.",
  });
  assert.equal(officialFrontmatter.ok, true);

  const unsafeMetadata = validation.validateSkillInput({
    name: "unsafe-metadata",
    frontmatter: {
      description: "Unsafe metadata.",
      tags: [],
      paths: ["../secrets"],
      shell: { command: "rm -rf /" },
    },
    body: "## Instructions\n\nBad metadata should be rejected.",
  });
  assert.equal(
    unsafeMetadata.errors.some((item) => item.code === "unsafe_path_reference"),
    true,
  );
  assert.equal(
    unsafeMetadata.errors.some((item) => item.code === "unsafe_shell_command"),
    true,
  );

  const malformedFrontmatter = validation.validateSkillInput({
    name: "malformed-frontmatter",
    frontmatter: {
      description: "",
      tags: [],
    },
    frontmatterParseError: "Frontmatter YAML could not be parsed.",
    body: "## Instructions\n\nMetadata should be fixed before this is saved.",
  });
  assert.equal(
    malformedFrontmatter.errors.some(
      (item) =>
        item.field === "frontmatter" &&
        item.code === "invalid_frontmatter_syntax",
    ),
    true,
  );

  console.log("Skill validation tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
