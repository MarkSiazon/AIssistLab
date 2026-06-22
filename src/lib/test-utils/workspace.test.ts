import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { withTempWorkspace } from "./workspace";

async function main() {
  const previousWorkspaceRoot = process.env.WORKSPACE_ROOT;
  const previousSkillsDir = process.env.SKILLS_DIR;
  const previousProvider = process.env.LLM_PROVIDER;
  let capturedRoot = "";

  await withTempWorkspace(
    {
      prefix: "test-utils-workspace-",
      env: {
        LLM_PROVIDER: "anthropic_api",
        SKILL_TRASH_DIR: ({ root }) => path.join(root, "trash"),
      },
      skills: [
        {
          name: "alpha",
          content: "---\ndescription: Alpha\n---\n\nAlpha body.\n",
        },
      ],
    },
    async ({ root, skillsPath, writeSkill }) => {
      capturedRoot = root;

      assert.equal(process.env.WORKSPACE_ROOT, root);
      assert.equal(process.env.SKILLS_DIR, ".claude/skills");
      assert.equal(process.env.LLM_PROVIDER, "anthropic_api");
      assert.equal(process.env.SKILL_TRASH_DIR, path.join(root, "trash"));
      assert.equal(process.env.RAG_INDEX_STATE_CACHE_PATH, path.join(root, "index-state.json"));

      const alpha = await fs.readFile(path.join(skillsPath, "alpha.md"), "utf-8");
      assert.match(alpha, /Alpha body/);

      await writeSkill("beta", "---\ndescription: Beta\n---\n\nBeta body.\n");
      const beta = await fs.readFile(path.join(skillsPath, "beta.md"), "utf-8");
      assert.match(beta, /Beta body/);
    },
  );

  assert.notEqual(capturedRoot, "");
  await assert.rejects(fs.stat(capturedRoot));
  assert.equal(process.env.WORKSPACE_ROOT, previousWorkspaceRoot);
  assert.equal(process.env.SKILLS_DIR, previousSkillsDir);
  assert.equal(process.env.LLM_PROVIDER, previousProvider);

  console.log("Test workspace helper tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
