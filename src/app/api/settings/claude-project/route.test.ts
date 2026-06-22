import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { withEnv } from "@/lib/test-utils/env";
import { localRequest, nonLocalRequest } from "@/lib/test-utils/request";
import { withTempWorkspace } from "@/lib/test-utils/workspace";

async function main() {
  const route = await import("./route");

  await withTempWorkspace({ prefix: "claude-project-api-" }, async ({ root }) => {
    const blocked = await route.GET(
      nonLocalRequest("/api/settings/claude-project"),
    );
    assert.equal(blocked.status, 403);

    await fs.mkdir(path.join(root, ".claude", "commands"), { recursive: true });
    await fs.writeFile(
      path.join(root, ".claude", "commands", "review.md"),
      "Review command.",
    );
    await fs.writeFile(path.join(root, ".mcp.json"), "{ invalid");

    const response = await route.GET(
      localRequest("/api/settings/claude-project"),
    );
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.counts.commands, 1);
    assert.equal(payload.counts.mcpServers, 0);
    assert.equal(
      payload.checks.some(
        (item: { id: string; status: string }) =>
          item.id === "claude-mcp" && item.status === "warn",
      ),
      true,
    );

    const raw = JSON.stringify(payload);
    assert.doesNotMatch(raw, new RegExp(root.replace(/\\/g, "\\\\"), "i"));
    assert.doesNotMatch(raw, /command.*review\.md/i);
  });

  await withEnv(
    {
      WORKSPACE_ROOT: path.join(
        os.tmpdir(),
        "missing-claude-project-route-workspace",
      ),
    },
    async () => {
      const response = await route.GET(
        localRequest("/api/settings/claude-project"),
      );
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.counts.skills, 0);
      assert.equal(
        payload.checks.some(
          (item: { id: string; status: string }) =>
            item.id === "claude-project-workspace" && item.status === "error",
        ),
        true,
      );
    },
  );

  console.log("Claude project settings route tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
