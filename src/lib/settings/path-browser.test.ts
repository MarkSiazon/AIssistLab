import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  browsePath,
  listWindowsDrives,
  searchDirectoriesByName,
} from "./path-browser";

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
  await withTempDir("path-browser-", async (root) => {
    await fs.mkdir(path.join(root, "b"));
    await fs.mkdir(path.join(root, "A"));
    await fs.mkdir(path.join(root, ".claude"));
    await fs.mkdir(path.join(root, ".hidden"));
    await fs.writeFile(path.join(root, "file.txt"), "not a directory");

    const result = await browsePath(root);

    assert.equal(result.path, root);
    assert.equal(result.parent, path.dirname(root));
    assert.equal(result.label, path.basename(root));
    assert.equal(result.isRoot, false);
    assert.deepEqual(
      result.entries.map((entry) => entry.name),
      [".claude", "A", "b"],
    );
    assert.deepEqual(
      result.entries.map((entry) => entry.type),
      ["dir", "dir", "dir"],
    );
  });

  await withTempDir("path-browser-errors-", async (root) => {
    const filePath = path.join(root, "file.txt");
    await fs.writeFile(filePath, "not a directory");

    assert.equal((await browsePath(filePath)).error, "Not a directory");
    assert.equal(
      (await browsePath(path.join(root, "missing"))).error,
      "Path not found",
    );
  });

  await withTempDir("path-browser-search-", async (root) => {
    await fs.mkdir(path.join(root, "Target"));
    await fs.mkdir(path.join(root, "nested", "target"), { recursive: true });
    await fs.mkdir(path.join(root, "node_modules", "target"), {
      recursive: true,
    });
    await fs.mkdir(path.join(root, ".git", "target"), { recursive: true });

    const result = await searchDirectoriesByName("target", {
      roots: [root],
      maxDepth: 3,
    });

    assert.equal(result.name, "target");
    assert.deepEqual(
      result.matches.map((match) => match.fullPath).sort(),
      [path.join(root, "Target"), path.join(root, "nested", "target")].sort(),
    );
    assert.equal(result.matches.every((match) => match.label === match.fullPath), true);
  });

  const drives = await listWindowsDrives(async (drivePath) => {
    if (drivePath === "C:\\") return;
    throw new Error("missing");
  });
  assert.deepEqual(drives, ["C:\\"]);

  const rootResult = await browsePath("", {
    platform: "win32",
    listDrives: async () => ["C:\\", "D:\\"],
  });
  assert.deepEqual(rootResult, {
    path: "",
    parent: null,
    label: "This PC",
    entries: [
      { name: "C:\\", fullPath: "C:\\", type: "drive" },
      { name: "D:\\", fullPath: "D:\\", type: "drive" },
    ],
    isRoot: true,
  });
}

main()
  .then(() => {
    console.log("Path browser tests passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
