import assert from "node:assert/strict";
import { createBrowseSearchRouteHandlers } from "./handlers";
import {
  localRequest,
  nonLocalRequest,
} from "@/lib/test-utils/request";

async function readJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

async function main(): Promise<void> {
  let searchNameSeen = "";
  let searchCalled = false;
  const handlers = createBrowseSearchRouteHandlers({
    searchDirectoriesByName: async (name) => {
      searchCalled = true;
      searchNameSeen = name;
      return {
        name,
        matches: [
          {
            fullPath: "C:\\Workspace\\.claude",
            parent: "C:\\Workspace",
            label: "C:\\Workspace\\.claude",
          },
        ],
      };
    },
  });

  const success = await handlers.GET(
    localRequest("/api/settings/browse/search?name=%20.claude%20"),
  );
  assert.equal(success.status, 200);
  assert.equal(searchCalled, true);
  assert.equal(searchNameSeen, ".claude");
  assert.deepEqual(await readJson(success), {
    name: ".claude",
    matches: [
      {
        fullPath: "C:\\Workspace\\.claude",
        parent: "C:\\Workspace",
        label: "C:\\Workspace\\.claude",
      },
    ],
  });

  searchCalled = false;
  const missing = await handlers.GET(
    localRequest("/api/settings/browse/search?name=%20"),
  );
  assert.equal(missing.status, 400);
  assert.equal(searchCalled, false);
  assert.match(String((await readJson(missing)).error), /name query param/i);

  const forbidden = await handlers.GET(
    nonLocalRequest("/api/settings/browse/search?name=.claude"),
  );
  assert.equal(forbidden.status, 403);
  assert.equal(searchCalled, false);

  console.log("Settings browse search route tests passed");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
