import assert from "node:assert/strict";
import {
  localRequest,
  nonLocalRequest,
  testRequest,
} from "@/lib/test-utils/request";
import { withTempWorkspace } from "@/lib/test-utils/workspace";

function routeParams(skillName: string) {
  return { params: Promise.resolve({ skillName }) };
}

async function main() {
  const skillRoute = await import("./[skillName]/route");

  await withTempWorkspace(
    {
      prefix: "skill-name-route-",
      skills: [
        {
          name: "alpha",
          content: [
            "---",
            "description: Alpha helper",
            "---",
            "",
            "## Instructions",
            "",
            "Use alpha.",
          ].join("\n"),
        },
        {
          name: "alpha,beta",
          content: [
            "---",
            "description: Comma named read-only skill",
            "---",
            "",
            "## Instructions",
            "",
            "Use the exact comma named skill.",
          ].join("\n"),
        },
      ],
    },
    async () => {
      const blocked = await skillRoute.GET(
        nonLocalRequest("/api/skills/alpha"),
        routeParams("alpha"),
      );
      assert.equal(blocked.status, 403);

      const safe = await skillRoute.GET(
        localRequest("/api/skills/alpha"),
        routeParams("alpha"),
      );
      assert.equal(safe.status, 200);
      assert.match((await safe.json()).body, /Use alpha/);

      const exact = await skillRoute.GET(
        localRequest("/api/skills/alpha%2Cbeta"),
        routeParams("alpha,beta"),
      );
      assert.equal(exact.status, 200);
      assert.match((await exact.json()).body, /exact comma named skill/);

      const edited = await skillRoute.PUT(
        testRequest("/api/skills/alpha", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            frontmatter: {
              description: "Updated alpha helper",
              tags: ["alpha", "review"],
            },
            body: "## Instructions\n\nUse the updated alpha workflow.",
          }),
        }),
        routeParams("alpha"),
      );
      const editedPayload = await edited.json();
      assert.equal(edited.status, 200);
      assert.equal(editedPayload.ok, true);
      assert.deepEqual(editedPayload.validationErrors, []);
      assert.equal(editedPayload.indexState.status, "stale");

      const updated = await skillRoute.GET(
        localRequest("/api/skills/alpha"),
        routeParams("alpha"),
      );
      assert.equal(updated.status, 200);
      assert.equal((await updated.json()).body.includes("updated alpha"), true);

      const missing = await skillRoute.GET(
        localRequest("/api/skills/missing%2Cskill"),
        routeParams("missing,skill"),
      );
      assert.equal(missing.status, 404);

      const malformedEdit = await skillRoute.PUT(
        testRequest("/api/skills/alpha", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: "{",
        }),
        routeParams("alpha"),
      );
      const malformedEditPayload = await malformedEdit.json();
      assert.equal(malformedEdit.status, 400);
      assert.equal(malformedEditPayload.ok, false);
      assert.deepEqual(
        malformedEditPayload.validationErrors.map(
          (item: { code: string }) => item.code,
        ),
        ["missing_description", "empty_body"],
      );

      const malformedDelete = await skillRoute.DELETE(
        testRequest("/api/skills/alpha", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: "{",
        }),
        routeParams("alpha"),
      );
      const malformedDeletePayload = await malformedDelete.json();
      assert.equal(malformedDelete.status, 400);
      assert.equal(
        malformedDeletePayload.error,
        "Type the exact skill name to confirm delete.",
      );
    },
  );

  console.log("Skill name route tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
