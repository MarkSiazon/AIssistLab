import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildMockDoctorReportPayload,
  buildMockRuntimeStatusPayload,
  buildMockSettingsEnvPayload,
} from "./settings-mocks.mjs";

const runtime = buildMockRuntimeStatusPayload();

assert.deepEqual(runtime, {
  provider: "anthropic_api",
  claudeCliEnabled: false,
  configDirConfigured: false,
  source: "runtime",
});

const envPayload = buildMockSettingsEnvPayload();

assert.match(envPayload.raw, /WORKSPACE_ROOT=\.\/examples\/demo-workspace/);
assert.equal(envPayload.parsed.LLM_PROVIDER, "anthropic_api");
assert.equal(envPayload.path, ".env.local");
assert.equal(envPayload.runtimeApplied, true);
assert.deepEqual(envPayload.activeRuntime, runtime);

const savePayload = buildMockSettingsEnvPayload({
  raw: "LLM_PROVIDER=anthropic_api\n",
  parsed: { LLM_PROVIDER: "anthropic_api" },
  includePath: false,
  includeRuntimeApplied: false,
});

assert.deepEqual(Object.keys(savePayload).sort(), [
  "activeRuntime",
  "parsed",
  "raw",
]);
assert.equal(savePayload.raw, "LLM_PROVIDER=anthropic_api\n");
assert.equal(savePayload.parsed.LLM_PROVIDER, "anthropic_api");

const doctorPayload = buildMockDoctorReportPayload();

assert.equal(doctorPayload.summary.status, "ok");
assert.equal(doctorPayload.summary.readinessScore, 100);
assert.equal(doctorPayload.summary.okCount, doctorPayload.checks.length);
assert.equal(doctorPayload.summary.topRecommendation, "Setup is ready.");
assert.deepEqual(doctorPayload.claudeProject.counts, {
  skills: 1,
  commands: 1,
  agents: 1,
  mcpServers: 1,
  hooks: 0,
  pluginFolders: 0,
});

for (const runnerPath of ["scripts/smoke-local.mjs", "scripts/smoke-production.mjs"]) {
  const source = readFileSync(runnerPath, "utf8");
  assert.match(
    source,
    /buildMockRuntimeStatusPayload/,
    `${runnerPath} should use the shared runtime status fixture builder`,
  );
  assert.match(
    source,
    /buildMockSettingsEnvPayload/,
    `${runnerPath} should use the shared settings env fixture builder`,
  );
}

const productionSource = readFileSync("scripts/smoke-production.mjs", "utf8");
assert.match(
  productionSource,
  /buildMockDoctorReportPayload/,
  "production smoke should use the shared Setup Doctor fixture builder",
);

console.log("Settings smoke mock helpers passed");
