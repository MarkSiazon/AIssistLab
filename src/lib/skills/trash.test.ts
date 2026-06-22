import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { withTempWorkspace, type TempWorkspace } from "@/lib/test-utils/workspace";

async function withWorkspace(fn: (workspace: TempWorkspace) => Promise<void>) {
  await withTempWorkspace(
    {
      prefix: "skill-trash-",
      env: {
        SKILL_TRASH_DIR: ({ root }) =>
          path.join(root, ".next", "cache", "skill-trash"),
      },
      clearIndexState: false,
      clearRuntimeProviderSettings: false,
    },
    fn,
  );
}

async function main() {
  const trash = await import("./trash");

  await withWorkspace(async ({ root, skillsPath, writeSkill }) => {
    const skillPath = path.join(skillsPath, "safe-delete.md");
    await writeSkill(
      "safe-delete",
      [
        "---",
        "description: Safe delete test",
        "---",
        "",
        "## Instructions",
        "",
        "Keep a backup before delete.",
      ].join("\n"),
    );

    const moved = await trash.moveSkillToTrash("safe-delete");
    assert.equal(moved.skillName, "safe-delete");
    assert.equal(moved.displayPath.includes(root), false);
    await assert.rejects(() => fs.access(skillPath));

    const latest = await trash.getLatestDeletedSkill();
    assert.equal(latest?.skillName, "safe-delete");
    assert.equal(JSON.stringify(latest).includes(root), false);

    const restored = await trash.restoreLatestDeletedSkill("safe-delete");
    assert.equal(restored.skillName, "safe-delete");
    const restoredContent = await fs.readFile(skillPath, "utf-8");
    assert.equal(restoredContent.includes("Safe delete test"), true);
  });

  await withWorkspace(async ({ skillsPath, writeSkill }) => {
    const skillPath = path.join(skillsPath, "safe-delete.md");
    await writeSkill(
      "safe-delete",
      [
        "---",
        "description: Original deleted skill",
        "---",
        "",
        "## Instructions",
        "",
        "Original content.",
      ].join("\n"),
    );

    await trash.moveSkillToTrash("safe-delete");
    await writeSkill(
      "safe-delete",
      [
        "---",
        "description: Recreated skill",
        "---",
        "",
        "## Instructions",
        "",
        "Do not overwrite this recreated content.",
      ].join("\n"),
    );

    await assert.rejects(
      () => trash.restoreLatestDeletedSkill("safe-delete"),
      /already exists/i,
    );
    const recreatedContent = await fs.readFile(skillPath, "utf-8");
    assert.equal(recreatedContent.includes("Do not overwrite"), true);
  });

  console.log("Skill trash tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
