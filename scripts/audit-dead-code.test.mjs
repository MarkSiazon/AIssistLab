import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const knipConfig = JSON.parse(readFileSync("knip.json", "utf8"));
const verifyReleaseSource = readFileSync("scripts/verify-release.mjs", "utf8");

assert.equal(
  packageJson.scripts["audit:dead-code"],
  "knip --include files,dependencies,unlisted,binaries,unresolved --no-progress",
  "package.json must expose the dead-code audit",
);

assert.match(
  verifyReleaseSource,
  /Dead code audit[\s\S]*audit:dead-code/,
  "verify:release must run the dead-code audit",
);

assert.deepEqual(
  knipConfig.ignoreBinaries,
  ["cmd.exe", "powershell.exe", "rg", "taskkill"],
  "dead-code audit must account for expected Windows and ripgrep system binaries",
);

assert.ok(
  knipConfig.entry.includes(
    "src/app/**/{layout,page,route,not-found,error,loading,template}.{ts,tsx}",
  ),
  "dead-code audit must treat Next app routes as entry points",
);

assert.ok(
  knipConfig.entry.includes("src/**/*.test.{ts,tsx}") &&
    knipConfig.entry.includes("scripts/**/*.test.mjs"),
  "dead-code audit must treat test files as entry points",
);

console.log("Dead-code audit wiring tests passed");
