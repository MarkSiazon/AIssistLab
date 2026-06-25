import path from "node:path";
import { expandUserPath } from "@/lib/claude/discovery";
import { getClaudeProjectInventory } from "@/lib/claude/project-inventory";
import {
  getClaudeCliStatus,
  getLastClaudeCliTestForProfile,
} from "@/lib/rag/llm-config";
import { getIndexStatus } from "@/lib/store";
import { readEnvFile } from "@/lib/settings/env";
import { getSettingsPathState } from "@/lib/settings/path-state";
import { getActiveProviderRuntimeEnv } from "@/lib/settings/runtime-config";
import {
  buildSetupDoctorReport,
  type SetupDoctorReport,
} from "@/lib/settings/doctor";

function resolveSkillsDir(workspaceRoot: string, skillsDir: string): string {
  if (!skillsDir.trim()) return "";
  const expandedSkillsDir = expandUserPath(skillsDir);
  if (path.isAbsolute(expandedSkillsDir)) return expandedSkillsDir;
  if (!workspaceRoot.trim()) return expandedSkillsDir;
  return path.join(expandUserPath(workspaceRoot), skillsDir);
}

export async function getCurrentSetupDoctorReport(): Promise<SetupDoctorReport> {
  const envFile = await readEnvFile();
  const workspaceRoot = envFile.parsed.WORKSPACE_ROOT ?? "";
  const skillsDir = envFile.parsed.SKILLS_DIR ?? "";
  const inventoryWorkspaceRoot =
    process.env.WORKSPACE_ROOT ?? workspaceRoot ?? process.cwd();
  const resolvedSkillsDir = resolveSkillsDir(workspaceRoot, skillsDir);
  const index = await getIndexStatus();
  const claude = await getClaudeCliStatus();

  return buildSetupDoctorReport({
    env: envFile.parsed,
    runtimeEnv: process.env,
    paths: {
      workspaceRoot: await getSettingsPathState(workspaceRoot),
      skillsDir: await getSettingsPathState(resolvedSkillsDir),
    },
    index: {
      status: index.status,
      builtAt: index.builtAt,
      skillCount: index.skillCount,
      chunkCount: index.chunkCount,
      staleReason: index.staleReason,
      error: index.error,
    },
    claude,
    claudeProject: await getClaudeProjectInventory(inventoryWorkspaceRoot),
    activeProviderEnv: getActiveProviderRuntimeEnv(),
    cliTest:
      (await getLastClaudeCliTestForProfile(
        claude.provider,
        claude.selectedProfile,
        claude.selectedProfileFingerprint,
      )) ?? undefined,
  });
}
