import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { parseFrontmatter } from "@/lib/markdown/frontmatter";
import { buildSkillQualityReport } from "@/lib/skills/quality";
import { validateSkillInput } from "@/lib/skills/validation";
import type { Skill } from "@/types/skill";

async function main(): Promise<void> {
  const repoRoot = process.cwd();
  const skillsDir = path.join(
    repoRoot,
    "examples",
    "demo-workspace",
    ".claude",
    "skills",
  );
  const entries = await fs.readdir(skillsDir, { withFileTypes: true });
  const skillFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort();

  assert.deepEqual(skillFiles, ["release-readiness-smoke.md"]);

  const skills: Skill[] = [];
  for (const fileName of skillFiles) {
    const filePath = path.join(skillsDir, fileName);
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = parseFrontmatter(raw);
    const name = fileName.replace(/\.md$/, "");
    const skill = {
      name,
      filePath,
      frontmatter: {
        ...parsed.data,
        description:
          typeof parsed.data.description === "string"
            ? parsed.data.description
            : "",
        tags: Array.isArray(parsed.data.tags)
          ? parsed.data.tags.filter((tag): tag is string => typeof tag === "string")
          : [],
      },
      body: parsed.content,
      raw,
      updatedAt: new Date(0).toISOString(),
    } satisfies Skill;

    const validation = validateSkillInput({
      name: skill.name,
      frontmatter: skill.frontmatter,
      body: skill.body,
    });
    assert.equal(validation.ok, true, JSON.stringify(validation.errors));
    skills.push(skill);
  }

  const quality = buildSkillQualityReport(skills);
  assert.equal(quality.issueCount, 0, JSON.stringify(quality.issues));
  assert.match(
    skills[0].body,
    /Skill Workshop V1 release candidate is ready\./,
  );

  console.log("Demo workspace test passed");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
