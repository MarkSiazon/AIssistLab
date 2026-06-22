import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { withTempWorkspace, type TempWorkspace } from "@/lib/test-utils/workspace";

async function withIndexWorkspace(fn: (workspace: TempWorkspace) => Promise<void>) {
  await withTempWorkspace({ prefix: "rag-index-state-" }, fn);
}

async function main() {
  const mod = await import("./index-state");

  await withIndexWorkspace(async ({ root }) => {
    await mod.clearPersistedIndexState();
    const missing = await mod.getIndexStateStatus();
    assert.equal(missing.status, "missing");
    assert.equal(missing.skillCount, 0);
    assert.equal(missing.chunkCount, 0);
    assert.equal(JSON.stringify(missing).includes(root), false);
  });

  await withIndexWorkspace(async ({ skillsPath }) => {
    await fs.writeFile(
      path.join(skillsPath, "alpha.md"),
      "---\ndescription: Alpha skill\n---\n\n## Alpha\n\nUse alpha well.\n",
    );
    await mod.markIndexReady({
      skillCount: 1,
      chunkCount: 2,
    });

    const ready = await mod.getIndexStateStatus();
    assert.equal(ready.status, "ready");
    assert.equal(ready.skillCount, 1);
    assert.equal(ready.chunkCount, 2);
    assert.equal(ready.staleReason, null);

    await fs.writeFile(
      path.join(skillsPath, "beta.md"),
      "---\ndescription: Beta skill\n---\n\n## Beta\n\nUse beta well.\n",
    );
    const stale = await mod.getIndexStateStatus();
    assert.equal(stale.status, "stale");
    assert.match(stale.staleReason ?? "", /changed/i);
  });

  await withIndexWorkspace(async () => {
    await mod.markIndexReady({
      skillCount: 1,
      chunkCount: 2,
    });
    await mod.markIndexStale("Skill files changed after save.");
    const stale = await mod.getIndexStateStatus();
    assert.equal(stale.status, "stale");
    assert.equal(stale.staleReason, "Skill files changed after save.");
  });

  await withIndexWorkspace(async () => {
    await mod.markIndexRebuilding();
    assert.equal((await mod.getIndexStateStatus()).status, "rebuilding");

    await mod.markIndexFailed("C:\\Users\\Private\\token-secret failed");
    const failed = await mod.getIndexStateStatus();
    assert.equal(failed.status, "failed");
    assert.equal(JSON.stringify(failed).includes("C:\\Users\\Private"), false);
    assert.equal(JSON.stringify(failed).includes("token-secret"), false);
  });

  console.log("RAG index state tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
