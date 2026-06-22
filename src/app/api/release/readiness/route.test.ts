import assert from "node:assert/strict";
import { localRequest, nonLocalRequest } from "@/lib/test-utils/request";
import { withTempWorkspace, type TempWorkspace } from "@/lib/test-utils/workspace";

async function withWorkspace(fn: (workspace: TempWorkspace) => Promise<void>) {
  await withTempWorkspace(
    {
      prefix: "release-readiness-",
      env: {
        LLM_PROVIDER: "anthropic_api",
        ENABLE_LOCAL_CLAUDE_CLI: "false",
        ANTHROPIC_API_KEY: "test-api-key",
      },
      skills: [
        {
          name: "release",
          content: [
            "---",
            "description: Prepare a release",
            "tags: [release]",
            "---",
            "",
            "Use this skill to prepare release notes.",
          ].join("\n"),
        },
      ],
    },
    fn,
  );
}

async function main() {
  const route = await import("./route");

  const forbidden = await route.GET(nonLocalRequest("/api/release/readiness"));
  assert.equal(forbidden.status, 403);

  await withWorkspace(async ({ root }) => {
    const state = await import("@/lib/rag/index-state");
    await state.markIndexStale("Skill files changed.");

    const response = await route.GET(
      localRequest("/api/release/readiness"),
    );
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.schemaVersion, 1);
    assert.equal(typeof payload.generatedAt, "string");
    assert.equal(payload.summary.canExportDiagnostics, true);
    assert.equal(payload.sections.length, 7);
    assert.equal(
      payload.sections.some(
        (section: { id: string; status: string }) =>
          section.id === "index" && section.status === "needs_action",
      ),
      true,
    );

    const raw = JSON.stringify(payload);
    assert.equal(raw.includes(root), false);
    assert.doesNotMatch(raw, /test-api-key/i);
    assert.doesNotMatch(raw, /oauth/i);
    assert.doesNotMatch(raw, /C:\\Users\\/i);
  });

  console.log("Release readiness route tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
