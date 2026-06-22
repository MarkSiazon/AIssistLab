import assert from "node:assert/strict";
import { saveSkillEditor } from "./skill-editor-api";

async function main() {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ input, init });
    if (String(input).includes("invalid")) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          validationErrors: [
            {
              field: "name",
              code: "invalid_name",
              message: "Invalid name.",
            },
          ],
        }),
        { status: 400 },
      );
    }

    return new Response(
      JSON.stringify({
        indexState: {
          status: "stale",
        },
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  try {
    const createResult = await saveSkillEditor({
      mode: "create",
      name: "new-skill",
      description: "Creates a skill",
      tags: ["skill"],
      body: "## Instructions",
      templateFrontmatter: { owner: "local" },
    });

    assert.equal(createResult.ok, true);
    assert.equal(createResult.indexStateStatus, "stale");
    assert.equal(calls[0].input, "/api/skills");
    assert.equal(calls[0].init?.method, "POST");
    assert.deepEqual(calls[0].init?.headers, {
      "Content-Type": "application/json",
    });
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
      name: "new-skill",
      frontmatter: {
        owner: "local",
        description: "Creates a skill",
        tags: ["skill"],
      },
      content: "## Instructions",
    });

    const editResult = await saveSkillEditor({
      mode: "edit",
      name: "invalid",
      description: "Invalid skill",
      tags: [],
      body: "",
      templateFrontmatter: {},
    });

    assert.equal(editResult.ok, false);
    assert.equal(editResult.error, "Validation failed");
    assert.equal(editResult.validationErrors[0].field, "name");
    assert.equal(calls[1].input, "/api/skills/invalid");
    assert.equal(calls[1].init?.method, "PUT");
    assert.deepEqual(calls[1].init?.headers, {
      "Content-Type": "application/json",
    });

    await saveSkillEditor({
      mode: "edit",
      name: "name with spaces",
      description: "Encoded skill",
      tags: [],
      body: "Body",
      templateFrontmatter: {},
    });

    assert.equal(calls[2].input, "/api/skills/name%20with%20spaces");
  } finally {
    globalThis.fetch = originalFetch;
  }

  console.log("Skill editor API tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
