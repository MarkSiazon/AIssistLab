import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  fetchChatReadiness,
  fetchDoctorReport,
  fetchSettingsEnv,
  getUnavailableClaudeCliStatus,
  openClaudeLogin,
  rebuildRagIndex,
  saveSettingsFields,
  testClaudeCli,
} from "./client-api";

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function createFetch(response: Response) {
  const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ input, init });
    return response;
  };
  return { fetcher, calls };
}

describe("settings client API helpers", () => {
  it("loads settings env data with stable empty defaults", async () => {
    const { fetcher, calls } = createFetch(
      jsonResponse({ parsed: { LLM_PROVIDER: "anthropic_api" } }),
    );

    const result = await fetchSettingsEnv(fetcher);

    assert.deepEqual(result, {
      raw: "",
      parsed: { LLM_PROVIDER: "anthropic_api" },
      path: "",
    });
    assert.equal(calls[0].input, "/api/settings");
  });

  it("throws the sanitized API error when settings env data is unavailable", async () => {
    const { fetcher } = createFetch(
      jsonResponse({ error: "Settings are local-only" }, 403),
    );

    await assert.rejects(
      () => fetchSettingsEnv(fetcher),
      /Settings are local-only/,
    );
  });

  it("normalizes chat readiness into nullable strings", async () => {
    const { fetcher } = createFetch(
      jsonResponse({
        canSend: false,
        blockingReason: "Provider not configured",
        suggestedAction: 42,
      }),
    );

    assert.deepEqual(await fetchChatReadiness(fetcher), {
      canSend: false,
      blockingReason: "Provider not configured",
      suggestedAction: null,
    });
  });

  it("loads the Setup Doctor report", async () => {
    const { fetcher, calls } = createFetch(
      jsonResponse({
        summary: {
          status: "ok",
          readinessScore: 100,
          errorCount: 0,
          warningCount: 0,
          okCount: 1,
          topRecommendation: null,
        },
        checks: [],
        claudeProject: null,
      }),
    );

    const report = await fetchDoctorReport(fetcher);

    assert.equal(report.summary.status, "ok");
    assert.equal(calls[0].input, "/api/settings/doctor");
  });

  it("builds a stable unavailable Claude CLI status fallback", () => {
    const status = getUnavailableClaudeCliStatus("Local-only endpoint blocked");

    assert.equal(status.provider, "anthropic_api");
    assert.equal(status.installed, false);
    assert.equal(status.selectedProfile.id, "default");
    assert.equal(status.selectedProfile.auth.error, "Local-only endpoint blocked");
    assert.equal(status.auth.error, "Local-only endpoint blocked");
  });

  it("saves field settings with profile selection in one JSON request", async () => {
    const { fetcher, calls } = createFetch(
      jsonResponse({
        raw: "LLM_PROVIDER=claude_code_cli",
        activeRuntime: {
          provider: "claude_code_cli",
          claudeCliEnabled: true,
          configDirConfigured: true,
          source: "runtime",
        },
      }),
    );

    const result = await saveSettingsFields(
      {
        vars: { LLM_PROVIDER: "claude_code_cli" },
        claudeProfileSelection: { profileId: "default" },
      },
      fetcher,
    );

    assert.equal(result.raw, "LLM_PROVIDER=claude_code_cli");
    assert.equal(calls[0].input, "/api/settings");
    assert.equal(calls[0].init?.method, "POST");
    assert.equal(calls[0].init?.headers?.["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
      vars: { LLM_PROVIDER: "claude_code_cli" },
      claudeProfileSelection: { profileId: "default" },
    });
  });

  it("posts selected Claude profile when opening login and testing CLI", async () => {
    const loginFetch = createFetch(jsonResponse({ loginCommand: "claude" }));
    const testFetch = createFetch(
      jsonResponse({ checked: true, ok: true, output: "OK", error: null }),
    );

    assert.equal(
      (await openClaudeLogin(
        {
          profileSelection: { manualConfigDir: "~/.claude-profiles/work" },
        },
        loginFetch.fetcher,
      )).loginCommand,
      "claude",
    );
    assert.deepEqual(JSON.parse(String(loginFetch.calls[0].init?.body)), {
      profileSelection: { manualConfigDir: "~/.claude-profiles/work" },
    });

    assert.deepEqual(
      await testClaudeCli(
        {
          profileSelection: { profileId: "default" },
        },
        testFetch.fetcher,
      ),
      { checked: true, ok: true, output: "OK", error: null },
    );
    assert.deepEqual(JSON.parse(String(testFetch.calls[0].init?.body)), {
      profileSelection: { profileId: "default" },
    });
  });

  it("rebuilds the RAG index with a POST request", async () => {
    const { fetcher, calls } = createFetch(
      jsonResponse({
        status: "ready",
        built: true,
        builtAt: "2026-06-19T00:00:00.000Z",
        skillCount: 1,
        chunkCount: 2,
        staleReason: null,
        workspaceDisplay: ".",
        skillsDirDisplay: ".claude/skills",
        error: null,
      }),
    );

    assert.equal((await rebuildRagIndex(fetcher)).status, "ready");
    assert.equal(calls[0].input, "/api/index");
    assert.equal(calls[0].init?.method, "POST");
  });
});
