#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const assetPattern = /\.(?:avif|gif|ico|jpe?g|png|svg|webp|woff2?)$/i;
const textPattern =
  /\.(?:css|html|js|json|jsx|md|mjs|ts|tsx|txt|yml|yaml)$/i;
const conventionAssets = new Set(["src/app/favicon.ico"]);

function runGit(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: options.cwd ?? repoRoot,
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "git command failed").trim());
  }
  return result.stdout;
}

function normalizePath(value) {
  return value.replace(/\\/g, "/");
}

export function listedFilesFromGitOutput(output) {
  return output
    .split(/\r?\n/)
    .map((line) => normalizePath(line.trim()))
    .filter(Boolean);
}

export function findUnusedAssets(files, readTextFile) {
  const assetFiles = files.filter((file) => assetPattern.test(file));
  const textFiles = files.filter(
    (file) => textPattern.test(file) && !assetPattern.test(file),
  );
  const textCorpus = textFiles
    .map((file) => readTextFile(file))
    .join("\n");

  return assetFiles.filter((asset) => {
    if (conventionAssets.has(asset)) return false;
    const basename = path.posix.basename(asset);
    return !textCorpus.includes(asset) && !textCorpus.includes(basename);
  });
}

export function filterExistingFiles(files, fileExists) {
  return files.filter((file) => fileExists(file));
}

function listTrackedAndVisibleUntrackedFiles() {
  const tracked = listedFilesFromGitOutput(runGit(["ls-files"]));
  const untracked = listedFilesFromGitOutput(
    runGit(["ls-files", "--others", "--exclude-standard"]),
  );
  const files = [...new Set([...tracked, ...untracked])].sort();
  return filterExistingFiles(files, (file) =>
    existsSync(path.join(repoRoot, file)),
  );
}

function readRepoTextFile(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function main() {
  const files = listTrackedAndVisibleUntrackedFiles();
  const unusedAssets = findUnusedAssets(files, readRepoTextFile);

  if (unusedAssets.length === 0) {
    console.log("No unused tracked or visible asset files found.");
    return;
  }

  console.error("Unused asset files found:");
  for (const asset of unusedAssets) {
    console.error(`- ${asset}`);
  }
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
