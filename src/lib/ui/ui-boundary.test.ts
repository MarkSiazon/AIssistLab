import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const uiRoot = path.join(process.cwd(), "src", "lib", "ui");
const entries = readdirSync(uiRoot, { withFileTypes: true }).sort((a, b) =>
  a.name.localeCompare(b.name),
);

const directories = entries
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

assert.deepEqual(
  directories,
  [],
  "src/lib/ui should stay flat for V1 unless the architecture map is updated for a deliberate split",
);

const sharedImplementationFiles = new Set([
  "browser-storage.ts",
  "button-type.ts",
  "internal-action-href.ts",
  "route-announcement.ts",
  "safe-navigation.ts",
  "tone.ts",
]);
const domainPrefixes = [
  "chat-",
  "claude-",
  "diagnostics-",
  "editor-",
  "export-",
  "first-run-",
  "guided-",
  "index-status-",
  "manual-external-",
  "path-picker-",
  "release-",
  "settings-",
  "setup-doctor-",
  "skill-",
  "skills-",
];
const implementationFiles = entries
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"));
const namingIssues = implementationFiles.filter(
  (name) =>
    !sharedImplementationFiles.has(name) &&
    !domainPrefixes.some((prefix) => name.startsWith(prefix)),
);

assert.deepEqual(
  namingIssues,
  [],
  "src/lib/ui implementation files should be domain-prefixed or explicitly shared",
);

const architecture = readFileSync("docs/architecture.md", "utf8");
assert.match(
  architecture,
  /`src\/lib\/ui\/` is intentionally flat for V1/,
  "architecture map should explain the V1 src/lib/ui boundary",
);

console.log("UI boundary tests passed");
