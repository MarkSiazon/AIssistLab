import assert from "node:assert/strict";
import { localRequest, nonLocalRequest } from "@/lib/test-utils/request";
import { withTempWorkspace } from "@/lib/test-utils/workspace";

async function main() {
  const route = await import("./route");

  await withTempWorkspace(
    {
      prefix: "rag-index-route-",
      skills: [
        {
          name: "alpha",
          content:
            "---\ndescription: Alpha\n---\n\n## Instructions\n\nUse alpha for tests.\n",
        },
      ],
    },
    async ({ root }) => {
      const forbidden = await route.GET(nonLocalRequest("/api/index"));
      assert.equal(forbidden.status, 403);

      const missing = await route.GET(localRequest("/api/index"));
      const missingPayload = await missing.json();
      assert.equal(missingPayload.status, "missing");
      assert.equal(JSON.stringify(missingPayload).includes(root), false);

      const rebuilt = await route.POST(
        localRequest("/api/index", { method: "POST" }),
      );
      const rebuiltPayload = await rebuilt.json();
      assert.equal(rebuilt.status, 200);
      assert.equal(rebuiltPayload.status, "ready");
      assert.equal(rebuiltPayload.skillCount, 1);
      assert.equal(rebuiltPayload.chunkCount > 0, true);
    },
  );

  console.log("Index route tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
