import assert from "node:assert/strict";
import { createNativeFolderRouteHandlers } from "./handlers";
import {
  localRequest,
  nonLocalRequest,
} from "@/lib/test-utils/request";

async function readJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

async function main(): Promise<void> {
  let runnerCalled = false;
  const unsupported = createNativeFolderRouteHandlers({
    platform: "linux",
    runWindowsFolderPicker: async () => {
      runnerCalled = true;
      return { code: 0, stdout: "", stderr: "", timedOut: false };
    },
  });
  const unsupportedResponse = await unsupported.GET(
    localRequest("/api/settings/native-folder"),
  );
  assert.equal(unsupportedResponse.status, 501);
  assert.equal(runnerCalled, false);
  assert.match(
    String((await readJson(unsupportedResponse)).error),
    /Windows only/i,
  );

  const blocked = await unsupported.GET(
    nonLocalRequest("/api/settings/native-folder?path=C%3A%5CWorkspace"),
  );
  assert.equal(blocked.status, 403);
  assert.equal(runnerCalled, false);

  let initialPathSeen = "";
  let titleSeen = "";
  const success = createNativeFolderRouteHandlers({
    platform: "win32",
    runWindowsFolderPicker: async (initialPath, title) => {
      initialPathSeen = initialPath;
      titleSeen = title;
      return {
        code: 0,
        stdout: "\r\nC:\\Selected\\Workspace\r\n",
        stderr: "",
        timedOut: false,
      };
    },
  });
  const successResponse = await success.GET(
    localRequest(
      "/api/settings/native-folder?path=%20C%3A%5CInitial%20&title=%20Choose%20workspace%20",
    ),
  );
  assert.equal(successResponse.status, 200);
  assert.equal(initialPathSeen, "C:\\Initial");
  assert.equal(titleSeen, "Choose workspace");
  assert.deepEqual(await readJson(successResponse), {
    path: "C:\\Selected\\Workspace",
  });

  const cancel = createNativeFolderRouteHandlers({
    platform: "win32",
    runWindowsFolderPicker: async () => ({
      code: 2,
      stdout: "",
      stderr: "",
      timedOut: false,
    }),
  });
  const cancelResponse = await cancel.GET(
    localRequest("/api/settings/native-folder"),
  );
  assert.equal(cancelResponse.status, 200);
  assert.deepEqual(await readJson(cancelResponse), { cancelled: true });

  const timeout = createNativeFolderRouteHandlers({
    platform: "win32",
    runWindowsFolderPicker: async () => ({
      code: null,
      stdout: "",
      stderr: "",
      timedOut: true,
    }),
  });
  const timeoutResponse = await timeout.GET(
    localRequest("/api/settings/native-folder"),
  );
  assert.equal(timeoutResponse.status, 408);
  assert.match(String((await readJson(timeoutResponse)).error), /timed out/i);

  console.log("Native folder route tests passed");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
