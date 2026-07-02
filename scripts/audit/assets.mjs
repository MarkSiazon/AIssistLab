#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  listExistingTrackedAndVisibleUntrackedFiles,
  readRepoTextFile,
} from "../lib/repo-files.mjs";

const assetPattern = /\.(?:avif|gif|ico|jpe?g|png|svg|webp|woff2?)$/i;
const textPattern =
  /\.(?:css|html|js|json|jsx|md|mjs|ts|tsx|txt|yml|yaml)$/i;
const conventionAssets = new Set(["src/app/favicon.ico"]);

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

function main() {
  const files = listExistingTrackedAndVisibleUntrackedFiles();
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
