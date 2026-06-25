import type {
  DoctorCheckStatus,
  SetupDoctorCheck,
} from "@/lib/settings/doctor";

export type ClaudeProjectDoctorStatus = DoctorCheckStatus;
export type ClaudeProjectDoctorCheck = SetupDoctorCheck;

export interface ClaudeProjectInventory {
  workspaceDisplay: string;
  counts: {
    skills: number;
    commands: number;
    agents: number;
    mcpServers: number;
    hooks: number;
    pluginFolders: number;
  };
  reloadHints: string[];
}

interface ClaudeProjectCountItem {
  label: string;
  value: number;
}

export interface ClaudeProjectInventoryPanelState {
  counts: ClaudeProjectCountItem[];
  highlightChecks: ClaudeProjectDoctorCheck[];
  actionChecks: ClaudeProjectDoctorCheck[];
  reloadHints: string[];
}

const HIGHLIGHT_CHECK_IDS = new Set([
  "claude-project-settings",
  "claude-local-settings",
]);

export function getClaudeProjectInventoryPanelState({
  inventory,
  doctorChecks,
}: {
  inventory: ClaudeProjectInventory | null;
  doctorChecks: ClaudeProjectDoctorCheck[];
}): ClaudeProjectInventoryPanelState {
  if (!inventory) {
    return {
      counts: [],
      highlightChecks: [],
      actionChecks: [],
      reloadHints: [],
    };
  }

  const projectChecks = doctorChecks.filter(
    (check) => check.group === "claude-project",
  );

  return {
    counts: [
      { label: "Skills", value: inventory.counts.skills },
      { label: "Commands", value: inventory.counts.commands },
      { label: "Agents", value: inventory.counts.agents },
      { label: "MCP", value: inventory.counts.mcpServers },
      { label: "Hooks", value: inventory.counts.hooks },
      { label: "Plugins", value: inventory.counts.pluginFolders },
    ],
    highlightChecks: projectChecks.filter((check) =>
      HIGHLIGHT_CHECK_IDS.has(check.id),
    ),
    actionChecks: projectChecks.filter(
      (check) => check.status !== "ok" && !HIGHLIGHT_CHECK_IDS.has(check.id),
    ),
    reloadHints: inventory.reloadHints,
  };
}
