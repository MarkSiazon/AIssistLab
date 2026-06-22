import assert from "node:assert/strict";
import { getClaudeProjectInventoryPanelState } from "./claude-project-inventory-panel";

const inventory = {
  workspaceDisplay: "~/workspace",
  counts: {
    skills: 2,
    commands: 3,
    agents: 4,
    mcpServers: 1,
    hooks: 5,
    pluginFolders: 6,
  },
  checks: [],
  reloadHints: ["Reload Claude Code after settings changes."],
};

const checks = [
  {
    id: "claude-project-settings",
    group: "claude-project",
    title: "Project settings",
    status: "ok" as const,
    severity: "optional" as const,
    message: "Shared settings found.",
    relatedEnvKeys: [],
  },
  {
    id: "claude-local-settings",
    group: "claude-project",
    title: "Local settings",
    status: "warn" as const,
    severity: "warning" as const,
    message: "Local settings are ignored by exports.",
    relatedEnvKeys: [],
  },
  {
    id: "claude-project-hooks",
    group: "claude-project",
    title: "Hooks",
    status: "warn" as const,
    severity: "warning" as const,
    message: "Hook commands are present.",
    suggestedFix: "Review hooks locally.",
    relatedEnvKeys: [],
  },
  {
    id: "workspace-root",
    group: "workspace",
    title: "Workspace",
    status: "error" as const,
    severity: "blocking" as const,
    message: "Workspace missing.",
    relatedEnvKeys: ["WORKSPACE_ROOT"],
  },
];

const state = getClaudeProjectInventoryPanelState({
  inventory,
  doctorChecks: checks,
});

assert.deepEqual(state.counts, [
  { label: "Skills", value: 2 },
  { label: "Commands", value: 3 },
  { label: "Agents", value: 4 },
  { label: "MCP", value: 1 },
  { label: "Hooks", value: 5 },
  { label: "Plugins", value: 6 },
]);
assert.deepEqual(
  state.highlightChecks.map((check) => check.id),
  ["claude-project-settings", "claude-local-settings"],
);
assert.deepEqual(
  state.actionChecks.map((check) => check.id),
  ["claude-project-hooks"],
);
assert.deepEqual(state.reloadHints, inventory.reloadHints);

const emptyState = getClaudeProjectInventoryPanelState({
  inventory: null,
  doctorChecks: checks,
});

assert.deepEqual(emptyState.counts, []);
assert.deepEqual(emptyState.highlightChecks, []);
assert.deepEqual(emptyState.actionChecks, []);
assert.deepEqual(emptyState.reloadHints, []);

console.log("Claude project inventory panel helper tests passed");
