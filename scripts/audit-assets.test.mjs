import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  filterExistingFiles,
  findUnusedAssets,
  listedFilesFromGitOutput,
} from "./audit-assets.mjs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const verifyReleaseSource = readFileSync("scripts/verify-release.mjs", "utf8");

assert.equal(
  packageJson.scripts["audit:assets"],
  "node scripts/audit-assets.mjs",
  "package.json must expose the asset audit",
);

assert.match(
  verifyReleaseSource,
  /Asset usage audit[\s\S]*audit:assets/,
  "verify:release must run the asset usage audit",
);

assert.deepEqual(
  listedFilesFromGitOutput("src/app/favicon.ico\nsrc/app/fonts/font.woff\n"),
  ["src/app/favicon.ico", "src/app/fonts/font.woff"],
  "git file output parser should normalize file lists",
);

const files = [
  "README.md",
  "docs/assets/screenshots/used.png",
  "src/app/favicon.ico",
  "src/app/fonts/unused.woff",
  "src/app/styles/app.css",
];
const text = new Map([
  ["README.md", "![Used](docs/assets/screenshots/used.png)"],
  ["src/app/styles/app.css", "body { color: black; }"],
]);

assert.deepEqual(
  findUnusedAssets(files, (file) => text.get(file) ?? ""),
  ["src/app/fonts/unused.woff"],
  "asset audit should ignore Next favicon convention and flag unreferenced fonts",
);

assert.deepEqual(
  filterExistingFiles(
    ["src/app/fonts/deleted.woff", "docs/assets/screenshots/used.png"],
    (file) => file !== "src/app/fonts/deleted.woff",
  ),
  ["docs/assets/screenshots/used.png"],
  "asset audit should not flag tracked files already deleted from the working tree",
);

console.log("Asset audit tests passed");
