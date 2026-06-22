import assert from "node:assert/strict";
import {
  applySkillsImport,
  deleteSkillByName,
  fetchSkillBody,
  previewSkillsImport,
} from "./client-api";

async function main() {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ input, init });
    if (String(input).includes("/import/preview")) {
      return Response.json({ previewId: "preview-1", skills: [] });
    }
    if (String(input).includes("/import/apply")) {
      return Response.json({ written: ["demo"], skipped: [], renamed: [] });
    }
    if (init?.method === "DELETE") return Response.json({ ok: true });
    return Response.json({ body: "## Instructions\nUse the skill." });
  }) as typeof fetch;

  try {
    assert.equal(await fetchSkillBody("demo skill"), "## Instructions\nUse the skill.");

    await deleteSkillByName("demo skill");
    assert.equal(calls[1].input, "/api/skills/demo%20skill");
    assert.equal(calls[1].init?.method, "DELETE");
    assert.deepEqual(calls[1].init?.headers, {
      "Content-Type": "application/json",
    });
    assert.deepEqual(JSON.parse(String(calls[1].init?.body)), {
      confirmName: "demo skill",
    });

    const preview = await previewSkillsImport({
      sourceType: "github",
      url: "https://github.com/example/repo/tree/main/skills",
    });
    assert.equal(preview.previewId, "preview-1");
    assert.equal(calls[2].input, "/api/skills/import/preview");
    assert.equal(calls[2].init?.method, "POST");

    const applied = await applySkillsImport({
      previewId: "preview-1",
      duplicateStrategy: "rename",
    });
    assert.deepEqual(applied.written, ["demo"]);
    assert.equal(calls[3].input, "/api/skills/import/apply");
    assert.deepEqual(JSON.parse(String(calls[3].init?.body)), {
      previewId: "preview-1",
      confirm: true,
      duplicateStrategy: "rename",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  console.log("Skill client API tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
