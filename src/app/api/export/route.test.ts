import assert from "node:assert/strict";
import { localRequest, nonLocalRequest } from "@/lib/test-utils/request";
import { withTempWorkspace } from "@/lib/test-utils/workspace";

async function main(): Promise<void> {
  const route = await import("./route");

  await withTempWorkspace(
    {
      prefix: "export-md-",
      skills: [
        {
          name: "alpha",
          content: "---\ndescription: Alpha\n---\n\n## Instructions\n\nAlpha content.\n",
        },
        {
          name: "alpha,beta",
          content: "---\ndescription: Comma\n---\n\n## Instructions\n\nComma content.\n",
        },
      ],
    },
    async () => {
      const blocked = await route.GET(
        nonLocalRequest("/api/export?skill=alpha"),
      );
      assert.equal(blocked.status, 403);

      const missingParam = await route.GET(localRequest("/api/export"));
      assert.equal(missingParam.status, 400);

      const safeName = await route.GET(localRequest("/api/export?skill=alpha"));
      assert.equal(safeName.status, 200);
      assert.equal(safeName.headers.get("content-type"), "text/markdown");
      assert.match(
        safeName.headers.get("content-disposition") ?? "",
        /alpha\.md/,
      );
      assert.match(await safeName.text(), /Alpha content/);

      const exactExistingName = await route.GET(
        localRequest("/api/export?skill=alpha%2Cbeta"),
      );
      assert.equal(exactExistingName.status, 200);
      assert.match(
        exactExistingName.headers.get("content-disposition") ?? "",
        /alpha,beta\.md/,
      );
      assert.match(await exactExistingName.text(), /Comma content/);

      const missing = await route.GET(
        localRequest("/api/export?skill=missing%2Cskill"),
      );
      assert.equal(missing.status, 404);
    },
  );

  console.log("Export route tests passed");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
