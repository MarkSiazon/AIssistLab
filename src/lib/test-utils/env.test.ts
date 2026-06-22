import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { withEnv, withTempCwd } from "./env";

async function main() {
  const originalCwd = process.cwd();
  const originalSet = process.env.TEST_UTILS_SET_VALUE;
  const originalDeleted = process.env.TEST_UTILS_DELETED_VALUE;
  process.env.TEST_UTILS_SET_VALUE = "before";
  process.env.TEST_UTILS_DELETED_VALUE = "before-delete";

  await withEnv(
    {
      TEST_UTILS_SET_VALUE: "during",
      TEST_UTILS_DELETED_VALUE: undefined,
      TEST_UTILS_NEW_VALUE: "new",
    },
    async () => {
      assert.equal(process.env.TEST_UTILS_SET_VALUE, "during");
      assert.equal(process.env.TEST_UTILS_DELETED_VALUE, undefined);
      assert.equal(process.env.TEST_UTILS_NEW_VALUE, "new");
    },
  );

  assert.equal(process.env.TEST_UTILS_SET_VALUE, "before");
  assert.equal(process.env.TEST_UTILS_DELETED_VALUE, "before-delete");
  assert.equal(process.env.TEST_UTILS_NEW_VALUE, undefined);

  let tempRoot = "";
  await withTempCwd("test-utils-env-", async (root) => {
    tempRoot = root;
    assert.equal(process.cwd(), root);
    await fs.writeFile("marker.txt", "ok", "utf-8");
    assert.equal(await fs.readFile("marker.txt", "utf-8"), "ok");
  });

  assert.notEqual(tempRoot, "");
  assert.equal(process.cwd(), originalCwd);
  await assert.rejects(fs.stat(tempRoot));

  if (originalSet === undefined) delete process.env.TEST_UTILS_SET_VALUE;
  else process.env.TEST_UTILS_SET_VALUE = originalSet;
  if (originalDeleted === undefined) delete process.env.TEST_UTILS_DELETED_VALUE;
  else process.env.TEST_UTILS_DELETED_VALUE = originalDeleted;

  console.log("Test env helper tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
