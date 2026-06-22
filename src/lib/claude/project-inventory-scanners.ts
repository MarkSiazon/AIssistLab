import fs from "node:fs/promises";
import path from "node:path";
import { fileExists, readDirectory } from "@/lib/claude/project-inventory-fs";
import { parseFrontmatter } from "@/lib/markdown/frontmatter";

export async function countProjectSkills(skillsDir: string): Promise<number> {
  const entries = await readDirectory(skillsDir);
  let count = entries.filter(
    (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"),
  ).length;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (await fileExists(path.join(skillsDir, entry.name, "SKILL.md"))) {
      count += 1;
    }
  }

  return count;
}

export async function countDirectMarkdownFiles(folder: string): Promise<number> {
  const entries = await readDirectory(folder);
  return entries.filter(
    (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"),
  ).length;
}

async function collectMarkdownFiles(
  folder: string,
  depth = 0,
  maxDepth = 4,
): Promise<string[]> {
  if (depth > maxDepth) return [];
  const entries = await readDirectory(folder);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(folder, entry.name);
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(fullPath);
    } else if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(fullPath, depth + 1, maxDepth)));
    }
  }

  return files.slice(0, 500);
}

export async function countInvalidAgentFiles(agentsDir: string): Promise<{
  total: number;
  invalid: number;
}> {
  const files = await collectMarkdownFiles(agentsDir);
  let invalid = 0;

  for (const file of files) {
    try {
      const parsed = parseFrontmatter(await fs.readFile(file, "utf-8"));
      const hasName =
        typeof parsed.data.name === "string" && parsed.data.name.trim().length > 0;
      const hasDescription =
        typeof parsed.data.description === "string" &&
        parsed.data.description.trim().length > 0;
      if (!hasName || !hasDescription) invalid += 1;
    } catch {
      invalid += 1;
    }
  }

  return { total: files.length, invalid };
}

export function countMcpServers(parsed: Record<string, unknown> | null): number {
  const servers = parsed?.mcpServers;
  if (!servers || typeof servers !== "object" || Array.isArray(servers)) return 0;
  return Object.keys(servers).length;
}

export function collectHookCategories(
  parsed: Record<string, unknown> | null,
): string[] {
  const hooks = parsed?.hooks;
  if (!hooks || typeof hooks !== "object" || Array.isArray(hooks)) return [];
  return Object.keys(hooks).filter((key) => key.trim().length > 0);
}

export async function countPluginFolders(
  workspaceRoot: string,
  claudeDir: string,
): Promise<number> {
  const found = new Set<string>();
  const rootPluginFolder = path.join(workspaceRoot, ".claude-plugin");
  if (await fileExists(path.join(rootPluginFolder, "plugin.json"))) {
    found.add(rootPluginFolder);
  }

  const queue: Array<{ folder: string; depth: number }> = [
    { folder: claudeDir, depth: 0 },
  ];
  let visited = 0;

  while (queue.length > 0 && visited < 200) {
    const current = queue.shift();
    if (!current || current.depth > 5) continue;
    visited += 1;
    const entries = await readDirectory(current.folder);
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const child = path.join(current.folder, entry.name);
      if (
        entry.name === ".claude-plugin" &&
        (await fileExists(path.join(child, "plugin.json")))
      ) {
        found.add(child);
      }
      queue.push({ folder: child, depth: current.depth + 1 });
    }
  }

  return found.size;
}
