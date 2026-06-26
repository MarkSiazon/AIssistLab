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
  appRouterRouteFromFile,
  collectAppRouterRouteFiles,
  collectFilesByExtension,
  collectSourceFiles,
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
  writeFileSync(path.join(tempRoot, "nested", "c.test.ts"), "c", "utf-8");
  writeFileSync(path.join(tempRoot, "homepage.tsx"), "home", "utf-8");

  assert.deepEqual(
    collectFilesByExtension(tempRoot, ".tsx").map((file) =>
      path.relative(tempRoot, file),
    ),
    [
      "a.test.tsx",
      "homepage.tsx",
      path.join("nested", "b.test.tsx"),
      "z.test.tsx",
    ],
    "source collection should be deterministic and recursive",
  );

  assert.deepEqual(
    collectSourceFiles([tempRoot], [".ts", ".tsx"]).map((file) =>
      path.relative(tempRoot, file),
    ),
    [
      path.join("nested", "c.test.ts"),
      path.join("nested", "ignored.ts"),
      "a.test.tsx",
      "homepage.tsx",
      path.join("nested", "b.test.tsx"),
      "z.test.tsx",
    ],
    "multi-extension source collection should preserve root and extension order",
  );

  assert.deepEqual(
    collectAppRouterRouteFiles(tempRoot, ".tsx", "page.tsx"),
    [],
    "app route collection should ignore files that do not match the route filename",
  );
  assert.throws(
    () => appRouterRouteFromFile(path.join(tempRoot, "nested", "page.tsx"), "page.tsx"),
    /not under src\/app/,
    "app route normalization should reject files outside the Next app tree",
  );

  const nestedFile = path.join(tempRoot, "nested", "b.test.tsx");
  assert.equal(readSource(nestedFile), "b");
  assert.equal(
    relativeSourcePath(path.join(process.cwd(), "src", "app", "page.tsx")),
    path.join("src", "app", "page.tsx"),
  );
  assert.equal(lineNumber("one\ntwo\r\nthree", 0), 1);
  assert.equal(lineNumber("one\ntwo\r\nthree", "one\ntwo\r\n".length), 3);
  assert.equal(
    appRouterRouteFromFile(
      path.join(process.cwd(), "src", "app", "page.tsx"),
      "page.tsx",
    ),
    "/",
  );
  assert.equal(
    appRouterRouteFromFile(
      path.join(
        process.cwd(),
        "src",
        "app",
        "editor",
        "[skillName]",
        "page.tsx",
      ),
      "page.tsx",
    ),
    "/editor/:skillName",
  );
  assert.equal(
    appRouterRouteFromFile(
      path.join(
        process.cwd(),
        "src",
        "app",
        "api",
        "skills",
        "[skillName]",
        "restore",
        "route.ts",
      ),
      "route.ts",
    ),
    "/api/skills/:skillName/restore",
  );
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

console.log("Static source test helper tests passed");
