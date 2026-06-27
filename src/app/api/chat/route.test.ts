import assert from "node:assert/strict";
import {
  jsonRequest,
  localRequest,
  nonLocalRequest,
  testRequest,
} from "@/lib/test-utils/request";
import { withTempWorkspace } from "@/lib/test-utils/workspace";

async function main() {
  const route = await import("./route");

  await withTempWorkspace(
    {
      prefix: "chat-route-",
      env: {
        LLM_PROVIDER: "anthropic_api",
        ANTHROPIC_API_KEY: undefined,
      },
      skills: [
        {
          name: "release-helper",
          content: [
            "---",
            "description: Release helper",
            "---",
            "",
            "## Instructions",
            "",
            "Use release helper for release readiness checks and QA evidence.",
          ].join("\n"),
        },
      ],
    },
    async () => {
      const blocked = await route.POST(
        nonLocalRequest("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{",
        }),
      );
      assert.equal(blocked.status, 403);
      assert.deepEqual(await blocked.json(), {
        error: "Local device access can only be used from localhost.",
      });

      const invalidJson = await route.POST(
        testRequest("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{",
        }),
      );
      assert.equal(invalidJson.status, 400);
      assert.deepEqual(await invalidJson.json(), { error: "query is required" });

      const nullBody = await route.POST(
        testRequest("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "null",
        }),
      );
      assert.equal(nullBody.status, 400);

      const missingQuery = await route.POST(
        jsonRequest("/api/chat", { query: "   " }),
      );
      assert.equal(missingQuery.status, 400);

      const streamedError = await route.POST(
        localRequest("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query: "release helper QA" }),
        }),
      );
      const body = await streamedError.text();
      assert.equal(streamedError.status, 200);
      assert.match(streamedError.headers.get("content-type") ?? "", /text\/event-stream/);
      assert.match(body, /"type":"citations"/);
      assert.match(body, /ANTHROPIC_API_KEY is not configured/);
    },
  );

  await withTempWorkspace(
    {
      prefix: "chat-route-cli-",
      env: {
        LLM_PROVIDER: "claude_code_cli",
        ENABLE_LOCAL_CLAUDE_CLI: "true",
      },
      skills: [
        {
          name: "cli-helper",
          content:
            "---\ndescription: CLI helper\n---\n\n## Instructions\n\nUse CLI helper.",
        },
      ],
    },
    async () => {
      const blocked = await route.POST(
        jsonRequest(
          "/api/chat",
          { query: "hello" },
          { host: "example.com" },
        ),
      );
      assert.equal(blocked.status, 403);
      assert.deepEqual(await blocked.json(), {
        error: "Local device access can only be used from localhost.",
      });
    },
  );

  console.log("Chat route tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
