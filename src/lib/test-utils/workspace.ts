import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { withEnv, type TestEnvValue } from "./env";

interface TempSkillFile {
  name: string;
  content: string;
}

type TempWorkspaceEnvValue =
  | string
  | undefined
  | ((workspace: Pick<TempWorkspace, "root" | "skillsPath">) => string | undefined);

export interface TempWorkspaceOptions {
  prefix?: string;
  skillsDir?: string;
  skills?: TempSkillFile[];
  env?: Record<string, TempWorkspaceEnvValue>;
  clearIndexState?: boolean;
  clearRuntimeProviderSettings?: boolean;
}

export interface TempWorkspace {
  root: string;
  skillsPath: string;
  writeSkill(name: string, content: string): Promise<void>;
}

function skillFileName(name: string): string {
  return name.endsWith(".md") ? name : `${name}.md`;
}

export async function withTempWorkspace(
  {
    prefix = "rag-interface-test-",
    skillsDir = ".claude/skills",
    skills = [],
    env = {},
    clearIndexState = true,
    clearRuntimeProviderSettings = true,
  }: TempWorkspaceOptions,
  fn: (workspace: TempWorkspace) => Promise<void>,
): Promise<void> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  const skillsPath = path.join(root, skillsDir);
  const managedEnv = {
    WORKSPACE_ROOT: root,
    SKILLS_DIR: skillsDir,
    RAG_INDEX_STATE_CACHE_PATH: path.join(root, "index-state.json"),
    ...Object.fromEntries(
      Object.entries(env).map(([key, value]) => [
        key,
        typeof value === "function" ? value({ root, skillsPath }) : value,
      ]),
    ),
  } satisfies Record<string, TestEnvValue>;

  async function writeSkill(name: string, content: string): Promise<void> {
    await fs.mkdir(skillsPath, { recursive: true });
    await fs.writeFile(path.join(skillsPath, skillFileName(name)), content, "utf-8");
  }

  try {
    await fs.mkdir(skillsPath, { recursive: true });
    await withEnv(managedEnv, async () => {
      for (const skill of skills) {
        await writeSkill(skill.name, skill.content);
      }

      if (clearRuntimeProviderSettings) {
        const runtime = await import("@/lib/settings/runtime-config");
        runtime.clearRuntimeProviderSettings();
      }
      if (clearIndexState) {
        const state = await import("@/lib/rag/index-state");
        await state.clearPersistedIndexState();
      }

      await fn({ root, skillsPath, writeSkill });
    });
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}
