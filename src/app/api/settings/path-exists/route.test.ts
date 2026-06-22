import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { localRequest, nonLocalRequest } from "@/lib/test-utils/request";
import { GET } from "./route";

async function withTempDir(
  prefix: string,
  fn: (root: string) => Promise<void>,
): Promise<void> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  try {
    await fn(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function readPayload(
  requestPath: string,
): Promise<{ status: number; exists: boolean; isDirectory: boolean }> {
  const response = await GET(localRequest(requestPath));
  const payload = (await response.json()) as {
    exists: boolean;
    isDirectory: boolean;
  };
  return {
    status: response.status,
    exists: payload.exists,
    isDirectory: payload.isDirectory,
  };
}

async function main(): Promise<void> {
  await withTempDir("path-exists-route-", async (root) => {
    const folder = path.join(root, "folder");
    const file = path.join(root, "file.txt");
    await fs.mkdir(folder);
    await fs.writeFile(file, "not a directory", "utf-8");

    assert.deepEqual(
      await readPayload(
        `/api/settings/path-exists?path=${encodeURIComponent(folder)}`,
      ),
      { status: 200, exists: true, isDirectory: true },
    );

    assert.deepEqual(
      await readPayload(
        `/api/settings/path-exists?path=${encodeURIComponent(file)}`,
      ),
      { status: 200, exists: true, isDirectory: false },
    );

    assert.deepEqual(
      await readPayload(
        `/api/settings/path-exists?path=${encodeURIComponent(
          path.join(root, "missing"),
        )}`,
      ),
      { status: 200, exists: false, isDirectory: false },
    );

    const previousUserProfile = process.env.USERPROFILE;
    const previousHome = process.env.HOME;
    process.env.USERPROFILE = root;
    process.env.HOME = root;
    try {
      assert.deepEqual(
        await readPayload(
          `/api/settings/path-exists?path=${encodeURIComponent(
            "~" + path.sep + "folder",
          )}`,
        ),
        { status: 200, exists: true, isDirectory: true },
      );
    } finally {
      if (previousUserProfile === undefined) delete process.env.USERPROFILE;
      else process.env.USERPROFILE = previousUserProfile;
      if (previousHome === undefined) delete process.env.HOME;
      else process.env.HOME = previousHome;
    }
  });

  const nonLocalResponse = await GET(
    nonLocalRequest("/api/settings/path-exists?path=~%5C.claude"),
  );
  assert.equal(nonLocalResponse.status, 403);

  console.log("Settings path-exists route tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
