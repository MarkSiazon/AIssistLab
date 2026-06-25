import path from "node:path";
import { expandUserPath } from "@/lib/claude/discovery";
import { directoryExists, readJsonObject } from "@/lib/claude/project-inventory-fs";
import {
  collectHookCategories,
  countDirectMarkdownFiles,
  countInvalidAgentFiles,
  countMcpServers,
  countPluginFolders,
  countProjectSkills,
} from "@/lib/claude/project-inventory-scanners";
import {
  projectInventoryCheck as check,
  sanitizeProjectText,
} from "@/lib/claude/project-inventory-sanitize";
import {
  EMPTY_CLAUDE_PROJECT_COUNTS,
  type ClaudeProjectInventory,
  type ClaudeProjectInventoryCheck,
} from "@/lib/claude/project-inventory-types";

export type {
  ClaudeProjectInventory,
} from "@/lib/claude/project-inventory-types";

function buildWorkspaceErrorInventory(
  workspaceDisplay: string,
): ClaudeProjectInventory {
  return {
    workspaceDisplay,
    counts: { ...EMPTY_CLAUDE_PROJECT_COUNTS },
    checks: [
      check(
        "claude-project-workspace",
        "error",
        "Claude project workspace",
        "Workspace root is not accessible for Claude project inventory.",
        "Set WORKSPACE_ROOT to an accessible project folder.",
      ),
    ],
    reloadHints: [],
  };
}

function buildInventoryChecks({
  counts,
  agents,
  mcpMalformed,
  sharedSettingsExists,
  sharedSettingsMalformed,
  localSettingsExists,
  localSettingsMalformed,
}: {
  counts: ClaudeProjectInventory["counts"];
  agents: { total: number; invalid: number };
  mcpMalformed: boolean;
  sharedSettingsExists: boolean;
  sharedSettingsMalformed: boolean;
  localSettingsExists: boolean;
  localSettingsMalformed: boolean;
}): ClaudeProjectInventoryCheck[] {
  return [
    check(
      "claude-project-workspace",
      "ok",
      "Claude project workspace",
      "Workspace root is accessible for read-only Claude project inventory.",
    ),
    check(
      "claude-skills",
      "ok",
      "Project skills",
      `${counts.skills} Claude project skill${counts.skills === 1 ? "" : "s"} detected.`,
      counts.skills === 0
        ? "Add reusable project skills under .claude/skills when needed."
        : undefined,
    ),
    check(
      "claude-commands",
      "ok",
      "Project commands",
      `${counts.commands} Claude project command${counts.commands === 1 ? "" : "s"} detected.`,
    ),
    agents.invalid > 0
      ? check(
          "claude-agents",
          "warn",
          "Project agents",
          `${agents.invalid} Claude project agent${agents.invalid === 1 ? "" : "s"} missing required name or description frontmatter.`,
          "Add name and description frontmatter to every project agent markdown file.",
        )
      : check(
          "claude-agents",
          "ok",
          "Project agents",
          `${counts.agents} Claude project agent${counts.agents === 1 ? "" : "s"} detected.`,
        ),
    mcpMalformed
      ? check(
          "claude-mcp",
          "warn",
          "Project MCP",
          "Project MCP config exists but could not be parsed.",
          "Fix .mcp.json syntax before relying on project MCP servers.",
        )
      : check(
          "claude-mcp",
          "ok",
          "Project MCP",
          `${counts.mcpServers} project MCP server${counts.mcpServers === 1 ? "" : "s"} configured.`,
        ),
    sharedSettingsMalformed
      ? check(
          "claude-project-settings",
          "warn",
          "Shared project settings",
          "Shared Claude project settings exist but could not be parsed.",
          "Fix .claude/settings.json syntax.",
        )
      : check(
          "claude-project-settings",
          "ok",
          "Shared project settings",
          sharedSettingsExists
            ? "Shared Claude project settings are present."
            : "No shared Claude project settings file detected.",
        ),
    localSettingsMalformed
      ? check(
          "claude-local-settings",
          "warn",
          "Local project settings",
          "Local-only Claude settings exist but could not be parsed.",
          "Fix .claude/settings.local.json syntax on this device.",
        )
      : check(
          "claude-local-settings",
          "ok",
          "Local project settings",
          localSettingsExists
            ? "Local-only Claude settings are present and should stay device-local."
            : "No local-only Claude settings file detected.",
        ),
    check(
      "claude-hooks",
      "ok",
      "Project hooks",
      `${counts.hooks} Claude hook categor${counts.hooks === 1 ? "y" : "ies"} detected.`,
    ),
    check(
      "claude-plugins",
      "ok",
      "Project plugins",
      `${counts.pluginFolders} Claude plugin-style folder${counts.pluginFolders === 1 ? "" : "s"} detected.`,
    ),
  ];
}

function buildReloadHints({
  counts,
  mcpExists,
  sharedSettingsExists,
  localSettingsExists,
}: {
  counts: ClaudeProjectInventory["counts"];
  mcpExists: boolean;
  sharedSettingsExists: boolean;
  localSettingsExists: boolean;
}): string[] {
  const reloadHints = new Set<string>();

  if (counts.skills > 0) {
    reloadHints.add("Reload skills after adding or changing skill packages.");
  }
  if (
    counts.commands > 0 ||
    counts.agents > 0 ||
    counts.hooks > 0 ||
    counts.pluginFolders > 0
  ) {
    reloadHints.add("Restart Claude Code after changing commands, agents, hooks, or plugins.");
  }
  if (mcpExists || sharedSettingsExists || localSettingsExists) {
    reloadHints.add("Restart Claude Code after editing project settings or MCP servers.");
  }

  return Array.from(reloadHints);
}

export async function getClaudeProjectInventory(
  workspaceRoot = process.env.WORKSPACE_ROOT ?? process.cwd(),
): Promise<ClaudeProjectInventory> {
  const resolvedWorkspace = path.resolve(
    expandUserPath(workspaceRoot || process.cwd()),
  );
  const workspaceDisplay = sanitizeProjectText(resolvedWorkspace);

  if (!(await directoryExists(resolvedWorkspace))) {
    return buildWorkspaceErrorInventory(workspaceDisplay);
  }

  const claudeDir = path.join(resolvedWorkspace, ".claude");
  const skills = await countProjectSkills(path.join(claudeDir, "skills"));
  const commands = await countDirectMarkdownFiles(path.join(claudeDir, "commands"));
  const agents = await countInvalidAgentFiles(path.join(claudeDir, "agents"));
  const mcp = await readJsonObject(path.join(resolvedWorkspace, ".mcp.json"));
  const sharedSettings = await readJsonObject(path.join(claudeDir, "settings.json"));
  const localSettings = await readJsonObject(
    path.join(claudeDir, "settings.local.json"),
  );
  const hookCategories = new Set([
    ...collectHookCategories(sharedSettings.parsed),
    ...collectHookCategories(localSettings.parsed),
  ]);
  const pluginFolders = await countPluginFolders(resolvedWorkspace, claudeDir);

  const counts: ClaudeProjectInventory["counts"] = {
    skills,
    commands,
    agents: agents.total,
    mcpServers: countMcpServers(mcp.parsed),
    hooks: hookCategories.size,
    pluginFolders,
  };

  return {
    workspaceDisplay,
    counts,
    checks: buildInventoryChecks({
      counts,
      agents,
      mcpMalformed: mcp.malformed,
      sharedSettingsExists: sharedSettings.exists,
      sharedSettingsMalformed: sharedSettings.malformed,
      localSettingsExists: localSettings.exists,
      localSettingsMalformed: localSettings.malformed,
    }),
    reloadHints: buildReloadHints({
      counts,
      mcpExists: mcp.exists,
      sharedSettingsExists: sharedSettings.exists,
      localSettingsExists: localSettings.exists,
    }),
  };
}
