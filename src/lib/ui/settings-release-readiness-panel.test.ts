import assert from "node:assert/strict";
import {
  getSettingsReleaseReadinessPanelState,
} from "./settings-release-readiness-panel";

const report = {
  schemaVersion: 1 as const,
  generatedAt: "2026-06-19T00:00:00.000Z",
  summary: {
    status: "blocked" as const,
    score: 42,
    topAction: "Fix workspace paths.",
    canChat: false,
    canExportDiagnostics: true,
  },
  sections: [
    {
      id: "workspace",
      label: "Workspace",
      status: "blocked" as const,
      message: "Workspace path is invalid.",
      actionLabel: "Open Settings",
      actionHref: "/settings",
    },
    {
      id: "skills",
      label: "Skills",
      status: "ready" as const,
      message: "Skills are valid.",
    },
    {
      id: "index",
      label: "Index",
      status: "needs_action" as const,
      message: "Index is stale.",
      actionLabel: "Rebuild Index",
      actionHref: "/settings",
    },
    {
      id: "diagnostics",
      label: "Diagnostics",
      status: "needs_action" as const,
      message: "Export diagnostics.",
      actionLabel: "Open Export",
      actionHref: "/export",
    },
  ],
};

const state = getSettingsReleaseReadinessPanelState(report);

assert.equal(state.readyCount, 1);
assert.equal(state.sectionCount, 4);
assert.equal(state.snapshotCount.blocked, 1);
assert.equal(state.snapshotCount.needsAction, 1);
assert.deepEqual(
  state.snapshotItems.map((item) => item.id),
  ["workspace", "index", "skills"],
);
assert.equal(state.primaryAction?.id, "workspace");

assert.deepEqual(getSettingsReleaseReadinessPanelState(null), {
  readyCount: 0,
  sectionCount: 0,
  snapshotItems: [],
  snapshotCount: {
    blocked: 0,
    needsAction: 0,
  },
  primaryAction: undefined,
});

console.log("Settings release readiness panel helper tests passed");
