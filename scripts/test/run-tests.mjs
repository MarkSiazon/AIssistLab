import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

const srcRoot = path.join(process.cwd(), "src");
const scriptsRoot = path.join(process.cwd(), "scripts");
const hasLocalTsx = Boolean(
  statSync(path.join(process.cwd(), "node_modules", "tsx"), {
    throwIfNoEntry: false,
  })?.isDirectory(),
);

function collectTests(directory, extension) {
  const entries = readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const tests = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      tests.push(...collectTests(fullPath, extension));
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      tests.push(fullPath);
    }
  }

  return tests;
}

if (!statSync(srcRoot, { throwIfNoEntry: false })?.isDirectory()) {
  console.error("src directory was not found.");
  process.exit(1);
}

const tests = [
  ...collectTests(srcRoot, ".test.ts"),
  ...(statSync(scriptsRoot, { throwIfNoEntry: false })?.isDirectory()
    ? collectTests(scriptsRoot, ".test.mjs")
    : []),
];
if (tests.length === 0) {
  console.error("No test files found under src or scripts.");
  process.exit(1);
}

const failed = [];

function runTest(relativePath) {
  const normalizedPath =
    process.platform === "win32" ? relativePath.replace(/\\/g, "/") : relativePath;

  if (normalizedPath.endsWith(".test.mjs")) {
    return spawnSync(process.execPath, [normalizedPath], {
      stdio: "inherit",
    });
  }

  if (hasLocalTsx) {
    return spawnSync(process.execPath, ["--import", "tsx", normalizedPath], {
      stdio: "inherit",
    });
  }

  if (process.platform === "win32") {
    return spawnSync("cmd.exe", ["/d", "/s", "/c", `npx --yes tsx ${normalizedPath}`], {
      stdio: "inherit",
    });
  }

  return spawnSync("npx", ["--yes", "tsx", normalizedPath], {
    stdio: "inherit",
  });
}

for (const testPath of tests) {
  const relativePath = path.relative(process.cwd(), testPath);
  console.log(`Running ${relativePath}`);
  const result = runTest(relativePath);

  if (result.error || result.status !== 0) {
    if (result.error) {
      console.error(result.error.message);
    }
    failed.push(relativePath);
  }
}

if (failed.length > 0) {
  console.error("\nFailed tests:");
  for (const testPath of failed) {
    console.error(`- ${testPath}`);
  }
  process.exit(1);
}

console.log(`All ${tests.length} test files passed`);
