import fs from "fs/promises";
import { SkillFrontmatter } from "@/types/skill";
import { stringifyFrontmatter } from "@/lib/markdown/frontmatter";
import { getSkillFilePath, getSkillsPath } from "./reader";

export async function writeSkill(
  skillName: string,
  frontmatter: SkillFrontmatter,
  body: string,
): Promise<void> {
  const dir = getSkillsPath();
  await fs.mkdir(dir, { recursive: true });
  const filePath = getSkillFilePath(skillName);
  if (!filePath) throw new Error("Invalid skill name");
  const content = stringifyFrontmatter(body, frontmatter);
  await fs.writeFile(filePath, content, "utf-8");
}
