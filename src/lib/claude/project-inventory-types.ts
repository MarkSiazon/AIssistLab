import type { StatusSeverity } from "@/lib/status/status-types";

export type ClaudeProjectInventoryStatus = StatusSeverity;

export interface ClaudeProjectInventoryCheck {
  id: string;
  status: ClaudeProjectInventoryStatus;
  title: string;
  message: string;
  suggestedFix?: string;
}

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
  checks: ClaudeProjectInventoryCheck[];
  reloadHints: string[];
}

export const EMPTY_CLAUDE_PROJECT_COUNTS: ClaudeProjectInventory["counts"] = {
  skills: 0,
  commands: 0,
  agents: 0,
  mcpServers: 0,
  hooks: 0,
  pluginFolders: 0,
};
