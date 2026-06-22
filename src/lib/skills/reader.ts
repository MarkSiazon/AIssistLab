import fs from "fs/promises";
import path from "path";
import { Skill } from "@/types/skill";
import { parseFrontmatter } from "@/lib/markdown/frontmatter";
import { isSafeSkillName } from "@/lib/skills/validation";

export function getWorkspaceRoot(): string {
  return process.env.WORKSPACE_ROOT ?? process.cwd();
}

export function getSkillsDir(): string {
  return process.env.SKILLS_DIR ?? ".claude/skills";
}

export function getSkillsPath(): string {
  const skillsDir = getSkillsDir();
  return path.isAbsolute(skillsDir)
    ? skillsDir
    : path.join(getWorkspaceRoot(), skillsDir);
}

export function getSkillFilePath(skillName: string): string | null {
  if (!isSafeSkillName(skillName)) return null;
  return path.join(getSkillsPath(), `${skillName}.md`);
}

export function normalizeSkillTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeFrontmatter(data: Record<string, unknown>): Skill["frontmatter"] {
  return {
    ...data,
    description: typeof data.description === "string" ? data.description : "",
    tags: normalizeSkillTags(data.tags),
  };
}

export async function readAllSkills(): Promise<Skill[]> {
  const dir = getSkillsPath();
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const mdFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .sort((a, b) => a.name.localeCompare(b.name));

  const skills = await Promise.all(
    mdFiles.map(async (entry): Promise<Skill | null> => {
      const filePath = path.join(dir, entry.name);
      try {
        const raw = await fs.readFile(filePath, "utf-8");
        const { data, content } = parseFrontmatter(raw);
        const stat = await fs.stat(filePath);

        return {
          name: entry.name.replace(/\.md$/, ""),
          filePath,
          frontmatter: normalizeFrontmatter(data),
          body: content,
          raw,
          updatedAt: stat.mtime.toISOString(),
        } satisfies Skill;
      } catch {
        return null;
      }
    }),
  );

  return skills.filter((skill): skill is Skill => Boolean(skill));
}

export async function readSkill(skillName: string): Promise<Skill | null> {
  const filePath = getSkillFilePath(skillName);
  if (!filePath) return null;

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const { data, content } = parseFrontmatter(raw);
    const stat = await fs.stat(filePath);
    return {
      name: skillName,
      filePath,
      frontmatter: normalizeFrontmatter(data),
      body: content,
      raw,
      updatedAt: stat.mtime.toISOString(),
    };
  } catch {
    return null;
  }
}
