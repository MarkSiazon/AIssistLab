import assert from "node:assert/strict";
import { createBrowseRouteHandlers } from "./handlers";
import {
  localRequest,
  nonLocalRequest,
} from "@/lib/test-utils/request";

async function readJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

async function main(): Promise<void> {
  let requestedPathSeen = "";
  let browseCalled = false;
  const handlers = createBrowseRouteHandlers({
    browsePath: async (requestedPath) => {
      browseCalled = true;
      requestedPathSeen = requestedPath;
      return {
        path: requestedPath,
        parent: "C:\\",
        label: "Workspace",
        entries: [
          {
            name: ".claude",
            fullPath: `${requestedPath}\\.claude`,
            type: "dir",
          },
        ],
        isRoot: false,
      };
    },
  });

  const success = await handlers.GET(
    localRequest("/api/settings/browse?path=%20C%3A%5CWorkspace%20"),
  );
  assert.equal(success.status, 200);
  assert.equal(browseCalled, true);
  assert.equal(requestedPathSeen, "C:\\Workspace");
  assert.deepEqual(await readJson(success), {
    path: "C:\\Workspace",
    parent: "C:\\",
    label: "Workspace",
    entries: [
      {
        name: ".claude",
        fullPath: "C:\\Workspace\\.claude",
        type: "dir",
      },
    ],
    isRoot: false,
  });

  browseCalled = false;
  const forbidden = await handlers.GET(
    nonLocalRequest("/api/settings/browse?path=C%3A%5CWorkspace"),
  );
  assert.equal(forbidden.status, 403);
  assert.equal(browseCalled, false);
  assert.match(String((await readJson(forbidden)).error), /localhost/i);

  console.log("Settings browse route tests passed");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
