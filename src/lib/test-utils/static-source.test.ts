import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  collectFilesByExtension,
  lineNumber,
  readSource,
  relativeSourcePath,
} from "./static-source";

const tempRoot = mkdtempSync(path.join(os.tmpdir(), "static-source-"));

try {
  mkdirSync(path.join(tempRoot, "nested"));
  writeFileSync(path.join(tempRoot, "z.test.tsx"), "z", "utf-8");
  writeFileSync(path.join(tempRoot, "a.test.tsx"), "a", "utf-8");
  writeFileSync(path.join(tempRoot, "nested", "b.test.tsx"), "b", "utf-8");
  writeFileSync(path.join(tempRoot, "nested", "ignored.ts"), "ignored", "utf-8");

  assert.deepEqual(
    collectFilesByExtension(tempRoot, ".tsx").map((file) =>
      path.relative(tempRoot, file),
    ),
    [
      "a.test.tsx",
      path.join("nested", "b.test.tsx"),
      "z.test.tsx",
    ],
    "source collection should be deterministic and recursive",
  );

  const nestedFile = path.join(tempRoot, "nested", "b.test.tsx");
  assert.equal(readSource(nestedFile), "b");
  assert.equal(
    relativeSourcePath(path.join(process.cwd(), "src", "app", "page.tsx")),
    path.join("src", "app", "page.tsx"),
  );
  assert.equal(lineNumber("one\ntwo\r\nthree", 0), 1);
  assert.equal(lineNumber("one\ntwo\r\nthree", "one\ntwo\r\n".length), 3);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

console.log("Static source test helper tests passed");
