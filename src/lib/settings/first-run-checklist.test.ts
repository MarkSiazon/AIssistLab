import assert from "node:assert/strict";
import {
  buildFirstRunChecklist,
  type FirstRunDoctorCheck,
} from "./first-run-checklist";

const baseChecks: FirstRunDoctorCheck[] = [
  {
    id: "workspace-root",
    group: "workspace",
    status: "ok",
    message: "Workspace root is accessible.",
  },
  {
    id: "skills-dir",
    group: "workspace",
    status: "ok",
    message: "Skills directory is accessible.",
  },
  {
    id: "rag-index",
    group: "rag",
    status: "ok",
    message: "Index ready.",
  },
  {
    id: "anthropic-api-key",
    group: "provider",
    status: "ok",
    message: "API key configured.",
  },
  {
    id: "claude-cli-install",
    group: "cli",
    status: "ok",
    message: "Claude CLI available.",
  },
  {
    id: "claude-cli-e2e",
    group: "cli",
    status: "ok",
    message: "CLI smoke test passed.",
  },
  {
    id: "runtime-env-sync",
    group: "provider",
    status: "ok",
    message: "Runtime env synced.",
  },
];

function byId(items: ReturnType<typeof buildFirstRunChecklist>) {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

async function main() {
  const apiReady = byId(
    buildFirstRunChecklist({
      doctorChecks: baseChecks,
      indexStatus: {
        status: "ready",
        skillCount: 2,
      },
      runtimeStatus: {
        provider: "anthropic_api",
        source: "runtime",
      },
      chatStatus: {
        canSend: true,
        blockingReason: null,
        suggestedAction: null,
      },
      diagnosticsExported: false,
    }),
  );

  assert.equal(Object.keys(apiReady).length, 7);
  assert.equal(apiReady.workspace.status, "ready");
  assert.equal(apiReady.skills.status, "ready");
  assert.equal(apiReady.index.status, "ready");
  assert.equal(apiReady.provider.status, "ready");
  assert.equal(apiReady.auth.status, "ready");
  assert.equal(apiReady.chat.status, "ready");
  assert.equal(apiReady.diagnostics.status, "optional");
  assert.equal(apiReady.diagnostics.action, "export-diagnostics");

  const apiWithCliProblem = byId(
    buildFirstRunChecklist({
      doctorChecks: baseChecks.map((check) =>
        check.id === "claude-cli-install"
          ? {
              ...check,
              status: "error",
              message: "Claude CLI is unavailable.",
            }
          : check,
      ),
      indexStatus: {
        status: "ready",
        skillCount: 1,
      },
      runtimeStatus: {
        provider: "anthropic_api",
        source: "runtime",
      },
      chatStatus: {
        canSend: true,
        blockingReason: null,
        suggestedAction: null,
      },
      diagnosticsExported: false,
    }),
  );
  assert.equal(apiWithCliProblem.provider.status, "ready");

  const missingWorkspace = byId(
    buildFirstRunChecklist({
      doctorChecks: baseChecks.map((check) =>
        check.id === "workspace-root"
          ? {
              ...check,
              status: "error",
              suggestedFix: "Set WORKSPACE_ROOT to an accessible folder.",
            }
          : check,
      ),
      indexStatus: {
        status: "missing",
        skillCount: 0,
      },
      runtimeStatus: {
        provider: "anthropic_api",
        source: "process",
      },
      chatStatus: {
        canSend: false,
        blockingReason: "ANTHROPIC_API_KEY is not configured.",
        suggestedAction: "Add a valid ANTHROPIC_API_KEY.",
      },
      diagnosticsExported: true,
    }),
  );
  assert.equal(missingWorkspace.workspace.status, "needs_action");
  assert.match(missingWorkspace.workspace.hint, /WORKSPACE_ROOT/);
  assert.equal(missingWorkspace.index.status, "needs_action");
  assert.equal(missingWorkspace.chat.status, "needs_action");
  assert.match(missingWorkspace.chat.hint, /ANTHROPIC_API_KEY/);
  assert.equal(missingWorkspace.diagnostics.status, "ready");

  const cliNeedsSmokeTest = byId(
    buildFirstRunChecklist({
      doctorChecks: baseChecks.map((check) =>
        check.id === "claude-cli-e2e"
          ? {
              ...check,
              status: "warn",
              message: "Claude CLI generation smoke test has not been run.",
            }
          : check,
      ),
      indexStatus: {
        status: "ready",
        skillCount: 1,
      },
      runtimeStatus: {
        provider: "claude_code_cli",
        source: "runtime",
      },
      chatStatus: {
        canSend: true,
        blockingReason: null,
        suggestedAction: null,
      },
      diagnosticsExported: false,
    }),
  );
  assert.equal(cliNeedsSmokeTest.auth.status, "needs_action");
  assert.equal(cliNeedsSmokeTest.auth.action, "test-cli");
  assert.equal(cliNeedsSmokeTest.auth.actionLabel, "Test CLI");

  const diagnosticsActionAfterExport = byId(
    buildFirstRunChecklist({
      doctorChecks: baseChecks,
      indexStatus: {
        status: "ready",
        skillCount: 3,
      },
      runtimeStatus: {
        provider: "anthropic_api",
        source: "runtime",
      },
      chatStatus: {
        canSend: true,
        blockingReason: null,
        suggestedAction: null,
      },
      diagnosticsExported: true,
    }),
  );
  assert.equal(diagnosticsActionAfterExport.diagnostics.actionLabel, "Open Export");

  console.log("First run checklist tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
