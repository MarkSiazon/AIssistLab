import assert from "node:assert/strict";
import { resolveRipgrepPath } from "./ripgrep.mjs";

// Returns the bundled @vscode/ripgrep binary when the package resolves and the
// file exists on disk.
assert.equal(
  resolveRipgrepPath({
    requireModule: () => ({ rgPath: "/bundled/rg.exe" }),
    fileExists: (candidate) => candidate === "/bundled/rg.exe",
  }),
  "/bundled/rg.exe",
);

// Falls back to the PATH-resolved "rg" when the bundled binary path does not
// exist on disk.
assert.equal(
  resolveRipgrepPath({
    requireModule: () => ({ rgPath: "/bundled/rg.exe" }),
    fileExists: () => false,
  }),
  "rg",
);

// Falls back to "rg" when the package is not installed at all.
assert.equal(
  resolveRipgrepPath({
    requireModule: () => {
      throw new Error("Cannot find module '@vscode/ripgrep'");
    },
    fileExists: () => true,
  }),
  "rg",
);

// Falls back to "rg" when the package resolves but exposes no rgPath.
assert.equal(
  resolveRipgrepPath({
    requireModule: () => ({}),
    fileExists: () => true,
  }),
  "rg",
);

console.log("Ripgrep resolver tests passed");
