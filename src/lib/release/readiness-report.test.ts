import assert from "node:assert/strict";
import { readAllSkills } from "@/lib/skills/reader";
import { withTempWorkspace } from "@/lib/test-utils/workspace";
import { getCurrentReleaseReadinessEvidence } from "./readiness-report";

async function main() {
  await withTempWorkspace(
    {
      prefix: "readiness-evidence-",
      env: {
        LLM_PROVIDER: "anthropic_api",
        ENABLE_LOCAL_CLAUDE_CLI: "false",
        ANTHROPIC_API_KEY: "test-api-key",
      },
      skills: [
        {
          name: "alpha",
          content: "---\ndescription: Alpha skill\n---\n\nAlpha body.\n",
        },
        {
          name: "beta",
          content: "---\ndescription: Beta skill\n---\n\nBeta body.\n",
        },
      ],
    },
    async ({ root }) => {
      const skills = await readAllSkills();
      const selected = skills.filter((skill) => skill.name === "alpha");

      const evidence = await getCurrentReleaseReadinessEvidence({
        generatedAt: "2026-06-19T00:00:00.000Z",
        skills: selected,
      });

      assert.equal(evidence.readiness.generatedAt, "2026-06-19T00:00:00.000Z");
      assert.equal(evidence.skillQuality.totalSkills, 1);
      assert.equal(evidence.readiness.sections.length, 7);
      assert.equal(evidence.claudeProject?.counts.skills, 2);
      assert.equal(evidence.readiness.summary.canExportDiagnostics, true);

      const raw = JSON.stringify(evidence);
      assert.equal(raw.includes(root), false);
      assert.doesNotMatch(raw, /test-api-key/i);
      assert.doesNotMatch(raw, /oauth/i);
    },
  );

  console.log("Release readiness evidence tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
