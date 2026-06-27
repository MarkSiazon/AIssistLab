import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  filterExistingFiles,
  listedFilesFromGitOutput,
  normalizeRepoPath,
  repoRoot,
} from "./repo-files.mjs";

assert.equal(
  normalizeRepoPath(path.relative(repoRoot, fileURLToPath(import.meta.url))),
  "scripts/lib/repo-files.test.mjs",
  "repo root should resolve to the app root",
);

assert.equal(
  normalizeRepoPath("src\\app\\favicon.ico"),
  "src/app/favicon.ico",
  "repo paths should normalize Windows separators",
);

assert.deepEqual(
  listedFilesFromGitOutput("src/app/favicon.ico\nsrc/app/fonts/font.woff\n"),
  ["src/app/favicon.ico", "src/app/fonts/font.woff"],
  "git file output parser should normalize file lists",
);

assert.deepEqual(
  filterExistingFiles(
    ["src/app/fonts/deleted.woff", "docs/assets/screenshots/used.png"],
    (file) => file !== "src/app/fonts/deleted.woff",
  ),
  ["docs/assets/screenshots/used.png"],
  "repo file helper should filter paths deleted from the working tree",
);

console.log("Repo file helper tests passed");
