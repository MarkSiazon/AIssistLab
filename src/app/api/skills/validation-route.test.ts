import assert from "node:assert/strict";
import { jsonRequest, localRequest, testRequest } from "@/lib/test-utils/request";
import { withTempWorkspace } from "@/lib/test-utils/workspace";

async function main() {
  const skillsRoute = await import("./route");
  const validationRoute = await import("./validation/route");

  await withTempWorkspace({ prefix: "skill-api-" }, async () => {
    const blocked = await skillsRoute.POST(
      jsonRequest("/api/skills", {}, { host: "example.com" }),
    );
    assert.equal(blocked.status, 403);

    const malformed = await skillsRoute.POST(
      testRequest("/api/skills", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      }),
    );
    const malformedPayload = await malformed.json();
    assert.equal(malformed.status, 400);
    assert.equal(malformedPayload.ok, false);
    assert.deepEqual(
      malformedPayload.validationErrors.map((item: { code: string }) => item.code),
      ["invalid_name", "missing_description", "empty_body"],
    );

    const invalid = await skillsRoute.POST(
      jsonRequest("/api/skills", {
        name: "../secret",
        frontmatter: { description: "", tags: ["x", "X"] },
        content: "",
      }),
    );
    const invalidPayload = await invalid.json();
    assert.equal(invalid.status, 400);
    assert.equal(invalidPayload.ok, false);
    assert.deepEqual(
      invalidPayload.validationErrors.map((item: { code: string }) => item.code),
      ["invalid_name", "missing_description", "empty_body", "duplicate_tags"],
    );

    const created = await skillsRoute.POST(
      jsonRequest("/api/skills", {
        name: "review-helper",
        frontmatter: { description: "Helps review code.", tags: ["review"] },
        content: "## Instructions\n\nReview the code and list concrete risks.",
      }),
    );
    const createdPayload = await created.json();
    assert.equal(created.status, 200);
    assert.equal(createdPayload.ok, true);
    assert.equal(createdPayload.indexState.status, "stale");

    const duplicate = await skillsRoute.POST(
      jsonRequest("/api/skills", {
        name: "review-helper",
        frontmatter: { description: "Duplicate skill.", tags: ["review"] },
        content: "## Instructions\n\nThis should not overwrite the original.",
      }),
    );
    const duplicatePayload = await duplicate.json();
    assert.equal(duplicate.status, 400);
    assert.equal(duplicatePayload.ok, false);
    assert.equal(
      duplicatePayload.validationErrors.some(
        (item: { code: string }) => item.code === "duplicate_name",
      ),
      true,
    );

    const quality = await validationRoute.GET(localRequest("/api/skills/validation"));
    const qualityPayload = await quality.json();
    assert.equal(quality.status, 200);
    assert.equal(qualityPayload.totalSkills, 1);
    assert.equal(Array.isArray(qualityPayload.issues), true);
  });

  console.log("Skill API validation route tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
