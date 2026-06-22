import assert from "node:assert/strict";
import type { SetupDoctorCheck } from "@/lib/settings/doctor";
import { getSetupDoctorCheckCardState } from "./setup-doctor-check-card";

const check: SetupDoctorCheck = {
  id: "workspace-root",
  group: "workspace",
  title: "Workspace",
  status: "error",
  severity: "blocking",
  message: "Workspace missing.",
  suggestedFix: "Set WORKSPACE_ROOT.",
  relatedEnvKeys: ["WORKSPACE_ROOT"],
};

const state = getSetupDoctorCheckCardState({
  check,
  showFix: true,
  showEnvKeys: true,
});

assert.equal(state.background, "var(--surface-2)");
assert.equal(state.statusColor, "var(--red)");
assert.equal(state.severityLabel, "Blocking");
assert.equal(state.fix, "Set WORKSPACE_ROOT.");
assert.equal(state.envKeysLabel, "WORKSPACE_ROOT");

const okState = getSetupDoctorCheckCardState({
  check: {
    ...check,
    status: "ok",
    suggestedFix: undefined,
    relatedEnvKeys: [],
  },
  showFix: false,
  showEnvKeys: false,
});

assert.equal(okState.background, "transparent");
assert.equal(okState.statusColor, "var(--green)");
assert.equal(okState.fix, null);
assert.equal(okState.envKeysLabel, null);

console.log("Setup Doctor check card helper tests passed");
