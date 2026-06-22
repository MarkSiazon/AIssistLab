import assert from "node:assert/strict";
import fs from "fs/promises";
import { withTempWorkspace, type TempWorkspace } from "@/lib/test-utils/workspace";

async function withWorkspace(fn: (workspace: TempWorkspace) => Promise<void>) {
  await withTempWorkspace(
    {
      prefix: "skill-reader-",
      clearIndexState: false,
      clearRuntimeProviderSettings: false,
    },
    fn,
  );
}

async function main() {
  const reader = await import("./reader");

  await withWorkspace(async ({ writeSkill }) => {
    await writeSkill(
      "official-style",
      [
        "---",
        "description: Official-style skill metadata",
        "tags: [official, preserve]",
        "when_to_use: Use when preserving Claude skill metadata.",
        "argument-hint: '[target]'",
        "user-invocable: true",
        "allowed-tools:",
        "  - Read",
        "  - Grep",
        "paths:",
        "  - references/example.md",
        "---",
        "",
        "## Instructions",
        "",
        "Keep official-style frontmatter intact when editing.",
      ].join("\n"),
    );

    const skill = await reader.readSkill("official-style");
    assert.equal(skill?.frontmatter.description, "Official-style skill metadata");
    assert.deepEqual(skill?.frontmatter.tags, ["official", "preserve"]);
    assert.equal(
      skill?.frontmatter.when_to_use,
      "Use when preserving Claude skill metadata.",
    );
    assert.equal(skill?.frontmatter["argument-hint"], "[target]");
    assert.equal(skill?.frontmatter["user-invocable"], true);
    assert.deepEqual(skill?.frontmatter["allowed-tools"], ["Read", "Grep"]);
    assert.deepEqual(skill?.frontmatter.paths, ["references/example.md"]);

    const allSkills = await reader.readAllSkills();
    assert.equal(allSkills[0].frontmatter.when_to_use, skill?.frontmatter.when_to_use);
  });

  await withWorkspace(async ({ writeSkill }) => {
    await writeSkill(
      "mixed-tags",
      [
        "---",
        "description: Mixed tag metadata",
        "tags: [official, 123, false, '', ' smoke ']",
        "---",
        "",
        "## Instructions",
        "",
        "Keep only string tags that can render in the skills UI.",
      ].join("\n"),
    );

    const skill = await reader.readSkill("mixed-tags");
    assert.deepEqual(skill?.frontmatter.tags, ["official", "smoke"]);

    const allSkills = await reader.readAllSkills();
    assert.deepEqual(allSkills[0].frontmatter.tags, ["official", "smoke"]);
  });

  await withWorkspace(async ({ skillsPath, writeSkill }) => {
    await writeSkill(
      "readable",
      [
        "---",
        "description: Readable skill",
        "---",
        "",
        "## Instructions",
        "",
        "This skill should still load when another file cannot be read.",
      ].join("\n"),
    );
    await writeSkill(
      "transient",
      [
        "---",
        "description: Transient skill",
        "---",
        "",
        "## Instructions",
        "",
        "This file simulates a local race or permissions failure.",
      ].join("\n"),
    );

    const originalReadFile = fs.readFile;
    const transientPathSuffix = "transient.md";
    fs.readFile = (async (filePath, ...args) => {
      if (String(filePath).endsWith(transientPathSuffix)) {
        throw new Error("Simulated transient read failure");
      }
      return originalReadFile.call(fs, filePath, ...args);
    }) as typeof fs.readFile;

    try {
      const allSkills = await reader.readAllSkills();
      assert.deepEqual(
        allSkills.map((skill) => skill.name),
        ["readable"],
      );
      assert.equal(allSkills[0].filePath.startsWith(skillsPath), true);
    } finally {
      fs.readFile = originalReadFile;
    }
  });

  await withWorkspace(async ({ writeSkill }) => {
    await writeSkill(
      "malformed-frontmatter",
      [
        "---",
        "description: [broken",
        "---",
        "",
        "## Instructions",
        "",
        "Malformed frontmatter should not hide this skill from the app.",
      ].join("\n"),
    );

    const allSkills = await reader.readAllSkills();
    assert.equal(allSkills.length, 1);
    assert.equal(allSkills[0].name, "malformed-frontmatter");
    assert.equal(allSkills[0].frontmatter.description, "");
    assert.match(allSkills[0].body, /Malformed frontmatter/);
  });

  console.log("Skill reader tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
