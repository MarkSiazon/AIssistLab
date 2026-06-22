import assert from "node:assert/strict";
import { localRequest, nonLocalRequest } from "@/lib/test-utils/request";
import { withTempWorkspace, type TempWorkspace } from "@/lib/test-utils/workspace";

async function withWorkspace(fn: (workspace: TempWorkspace) => Promise<void>) {
  await withTempWorkspace(
    {
      prefix: "chat-status-",
      env: {
        LLM_PROVIDER: "anthropic_api",
        ENABLE_LOCAL_CLAUDE_CLI: "false",
        ANTHROPIC_API_KEY: "test-api-key",
      },
    },
    fn,
  );
}

async function main() {
  const route = await import("./route");

  await withWorkspace(async ({ root }) => {
    const blocked = await route.GET(nonLocalRequest("/api/chat/status"));
    assert.equal(blocked.status, 403);

    const response = await route.GET(localRequest("/api/chat/status"));
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.provider, "anthropic_api");
    assert.equal(payload.index.status, "missing");
    assert.equal(payload.index.skillCount, 0);
    assert.equal(payload.canSend, true);
    assert.equal(payload.blockingReason, null);
    assert.match(payload.suggestedAction, /Rebuild Index/i);
    assert.deepEqual(payload.suggestedQuestions, []);
    assert.equal(JSON.stringify(payload).includes(root), false);
    assert.equal(JSON.stringify(payload).includes("ANTHROPIC_API_KEY"), false);
  });

  await withWorkspace(async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const response = await route.GET(localRequest("/api/chat/status"));
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.canSend, false);
    assert.match(payload.blockingReason, /ANTHROPIC_API_KEY/);
    assert.match(payload.suggestedAction, /Add a valid ANTHROPIC_API_KEY/);
  });

  await withWorkspace(async () => {
    process.env.LLM_PROVIDER = "claude_code_cli";
    process.env.ENABLE_LOCAL_CLAUDE_CLI = "false";
    const response = await route.GET(localRequest("/api/chat/status"));
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.provider, "claude_code_cli");
    assert.equal(payload.canSend, false);
    assert.match(payload.blockingReason, /disabled/i);
    assert.match(payload.suggestedAction, /ENABLE_LOCAL_CLAUDE_CLI=true/);
  });

  await withWorkspace(async () => {
    const state = await import("@/lib/rag/index-state");
    await state.markIndexStale("Skill files changed.");
    const response = await route.GET(localRequest("/api/chat/status"));
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.index.status, "stale");
    assert.equal(payload.canSend, true);
    assert.equal(payload.blockingReason, null);
    assert.match(payload.suggestedAction, /Rebuild Index/i);
  });

  await withWorkspace(async () => {
    const state = await import("@/lib/rag/index-state");
    await state.markIndexReady({ skillCount: 1, chunkCount: 2 });
    const response = await route.GET(localRequest("/api/chat/status"));
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.index.status, "ready");
    assert.equal(payload.canSend, true);
    assert.equal(payload.blockingReason, null);
    assert.equal(payload.suggestedAction, null);
  });

  await withWorkspace(async ({ writeSkill }) => {
    await writeSkill(
      "pr-review",
      [
        "---",
        "description: Review pull requests",
        "tags: [review]",
        "---",
        "",
        "Review a PR before it is merged.",
      ].join("\n"),
    );
    await writeSkill(
      "release-notes",
      [
        "---",
        "description: Draft release notes",
        "tags: [release]",
        "---",
        "",
        "Summarize shipped changes.",
      ].join("\n"),
    );

    const response = await route.GET(localRequest("/api/chat/status"));
    const payload = await response.json();
    assert.deepEqual(payload.suggestedQuestions, [
      "How should I use pr-review?",
      "How should I use release-notes?",
    ]);
  });

  console.log("Chat status route tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
