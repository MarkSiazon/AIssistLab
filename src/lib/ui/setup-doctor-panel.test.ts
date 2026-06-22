import assert from "node:assert/strict";
import type {
  DoctorCheckGroup,
  SetupDoctorReport,
} from "@/lib/settings/doctor";
import { getSetupDoctorPanelState } from "./setup-doctor-panel";

const groupLabels: Record<DoctorCheckGroup, string> = {
  workspace: "Workspace",
  rag: "RAG Index",
  provider: "Claude Provider",
  cli: "Claude CLI",
  login: "Login Helper",
  "claude-project": "Claude Project",
};

const report: SetupDoctorReport = {
  summary: {
    status: "warn",
    readinessScore: 72,
    errorCount: 1,
    warningCount: 2,
    okCount: 3,
    topRecommendation: "Rebuild the index.",
  },
  checks: [
    {
      id: "workspace-root",
      group: "workspace",
      title: "Workspace",
      status: "ok",
      severity: "blocking",
      message: "Workspace ready.",
      relatedEnvKeys: [],
    },
    {
      id: "rag-index",
      group: "rag",
      title: "Index",
      status: "warn",
      severity: "warning",
      message: "Index stale.",
      relatedEnvKeys: ["WORKSPACE_ROOT"],
    },
    {
      id: "anthropic-api-key",
      group: "provider",
      title: "API key",
      status: "error",
      severity: "blocking",
      message: "API key missing.",
      relatedEnvKeys: ["ANTHROPIC_API_KEY"],
    },
  ],
  claudeProject: null,
};

const state = getSetupDoctorPanelState({ report, groupLabels });

assert.equal(state.statusLabel, "Needs attention");
assert.equal(state.scoreLabel, "Readiness score 72/100");
assert.equal(state.countsLabel, "1 error, 2 warnings");
assert.equal(state.topRecommendation, "Rebuild the index.");
assert.deepEqual(
  state.topActions.map((item) => item.id),
  ["rag-index", "anthropic-api-key"],
);
assert.deepEqual(
  state.groups.map((group) => [group.id, group.label, group.checks.length]),
  [
    ["workspace", "Workspace", 1],
    ["rag", "RAG Index", 1],
    ["provider", "Claude Provider", 1],
  ],
);

const okState = getSetupDoctorPanelState({
  report: {
    ...report,
    summary: {
      status: "ok",
      readinessScore: 100,
      errorCount: 0,
      warningCount: 0,
      okCount: 3,
      topRecommendation: null,
    },
    checks: report.checks.map((check) => ({ ...check, status: "ok" })),
  },
  groupLabels,
});

assert.equal(okState.statusLabel, "Ready");
assert.equal(okState.countsLabel, "0 errors, 0 warnings");
assert.deepEqual(okState.topActions, []);

console.log("Setup Doctor panel helper tests passed");
