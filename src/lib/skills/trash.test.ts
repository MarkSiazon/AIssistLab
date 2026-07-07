import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
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

  // A deletion in one workspace must not surface as restorable in a different
  // workspace, even when both share the same trash directory.
  const sharedTrash = await fs.mkdtemp(
    path.join(os.tmpdir(), "skill-trash-shared-"),
  );
  try {
    await withTempWorkspace(
      {
        prefix: "skill-trash-ws-a-",
        env: { SKILL_TRASH_DIR: sharedTrash },
        clearIndexState: false,
        clearRuntimeProviderSettings: false,
      },
      async ({ writeSkill }) => {
        await writeSkill(
          "cross-workspace",
          "---\ndescription: Deleted in workspace A\n---\n\n## Instructions\n\nA.\n",
        );
        await trash.moveSkillToTrash("cross-workspace");
        const latest = await trash.getLatestDeletedSkill();
        assert.equal(
          latest?.skillName,
          "cross-workspace",
          "deletion should be restorable within its own workspace",
        );
      },
    );

    await withTempWorkspace(
      {
        prefix: "skill-trash-ws-b-",
        env: { SKILL_TRASH_DIR: sharedTrash },
        clearIndexState: false,
        clearRuntimeProviderSettings: false,
      },
      async ({ skillsPath }) => {
        const latest = await trash.getLatestDeletedSkill();
        assert.equal(
          latest,
          null,
          "another workspace must not see the deletion as restorable",
        );
        await assert.rejects(
          () => trash.restoreLatestDeletedSkill("cross-workspace"),
          /No deleted skill/i,
          "restore must not resurrect a skill from a different workspace",
        );
        await assert.rejects(
          () => fs.access(path.join(skillsPath, "cross-workspace.md")),
          "the foreign skill must not be written into this workspace",
        );
      },
    );
  } finally {
    await fs.rm(sharedTrash, { recursive: true, force: true });
  }

  console.log("Skill trash tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
