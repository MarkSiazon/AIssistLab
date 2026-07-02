import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { findUnusedAssets } from "./assets.mjs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const verifyReleaseSource = readFileSync("scripts/release/verify.mjs", "utf8");

assert.equal(
  packageJson.scripts["audit:assets"],
  "node scripts/audit/assets.mjs",
  "package.json must expose the asset audit",
);

assert.match(
  verifyReleaseSource,
  /Asset usage audit[\s\S]*audit:assets/,
  "verify:release must run the asset usage audit",
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

console.log("Asset audit tests passed");
