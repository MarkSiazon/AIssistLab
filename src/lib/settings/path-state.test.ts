import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  getSettingsPathState,
  missingPathState,
} from "@/lib/settings/path-state";

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

async function main(): Promise<void> {
  await withTempDir("settings-path-state-", async (root) => {
    const folder = path.join(root, "folder");
    const file = path.join(root, "file.txt");
    await fs.mkdir(folder);
    await fs.writeFile(file, "not a directory", "utf-8");

    assert.deepEqual(await getSettingsPathState(""), missingPathState);
    assert.deepEqual(
      await getSettingsPathState(path.join(root, "missing")),
      missingPathState,
    );
    assert.deepEqual(await getSettingsPathState(folder), {
      exists: true,
      isDirectory: true,
    });
    assert.deepEqual(await getSettingsPathState(file), {
      exists: true,
      isDirectory: false,
    });

    const previousUserProfile = process.env.USERPROFILE;
    const previousHome = process.env.HOME;
    process.env.USERPROFILE = root;
    process.env.HOME = root;
    try {
      assert.deepEqual(
        await getSettingsPathState("~" + path.sep + "folder"),
        {
          exists: true,
          isDirectory: true,
        },
      );
    } finally {
      if (previousUserProfile === undefined) delete process.env.USERPROFILE;
      else process.env.USERPROFILE = previousUserProfile;
      if (previousHome === undefined) delete process.env.HOME;
      else process.env.HOME = previousHome;
    }
  });

  console.log("Settings path state tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
