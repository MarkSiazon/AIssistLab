import assert from "node:assert/strict";
import { withTempWorkspace } from "@/lib/test-utils/workspace";
import { getCurrentChatStatus } from "./status";

async function main() {
  await withTempWorkspace(
    {
      prefix: "chat-status-helper-",
      env: {
        LLM_PROVIDER: "anthropic_api",
        ENABLE_LOCAL_CLAUDE_CLI: "false",
        ANTHROPIC_API_KEY: "test-api-key",
      },
      skills: [
        {
          name: "review",
          content: "---\ndescription: Review work\n---\n\nReview content.\n",
        },
      ],
    },
    async ({ root }) => {
      const status = await getCurrentChatStatus();

      assert.equal(status.provider, "anthropic_api");
      assert.equal(status.runtimeSource, "process");
      assert.equal(status.claudeCliEnabled, false);
      assert.equal(status.index.status, "missing");
      assert.equal(status.canSend, true);
      assert.equal(status.blockingReason, null);
      assert.deepEqual(status.suggestedQuestions, ["How should I use review?"]);

      const withoutSuggestions = await getCurrentChatStatus({
        includeSuggestedQuestions: false,
      });
      assert.deepEqual(withoutSuggestions.suggestedQuestions, []);

      const raw = JSON.stringify(status);
      assert.equal(raw.includes(root), false);
      assert.doesNotMatch(raw, /test-api-key/i);
    },
  );

  console.log("Chat status helper tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
