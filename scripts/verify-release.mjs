import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  privacyScanPattern,
  privacyScanSuccessMessage,
} from "./smoke/privacy-assertions.mjs";

const privacyScanPaths = [
  "package.json",
  "package-lock.json",
  "scripts",
  "src/app",
  "src/components",
  "src/hooks",
  "src/lib",
  "docs",
  "README.md",
];
const textFilePattern =
  /\.(?:css|html|js|json|jsx|md|mjs|ts|tsx|txt|yml|yaml)$/i;
const releaseScanRoots = [
  "package.json",
  "package-lock.json",
  "scripts/",
  "src/app/",
  "src/components/",
  "src/hooks/",
  "src/lib/",
  "docs/",
  "README.md",
];

function runCommand(label, command, args = [], options = {}) {
  console.log(`\n==> ${label}`);
  const commandLine = [command, ...args].join(" ");
  const result =
    process.platform === "win32" && command === "npm"
      ? spawnSync("cmd.exe", ["/d", "/s", "/c", commandLine], {
          stdio: "inherit",
          ...options,
        })
      : spawnSync(command, args, {
          stdio: "inherit",
          ...options,
        });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runPrivacyScan() {
  console.log("\n==> Privacy scan");
  const result = spawnSync(
    "rg",
    [
      "--pcre2",
      "-n",
      "--glob",
      "!*.test.ts",
      "--glob",
      "!*.test.mjs",
      privacyScanPattern,
      ...privacyScanPaths,
    ],
    {
      encoding: "utf8",
    },
  );

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status === 1) {
    console.log(privacyScanSuccessMessage);
    return;
  }

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exit(1);
}

runCommand("Full test sweep", "npm", ["test"]);
runCommand("Lint", "npm", ["run", "lint"]);
runCommand("Production build", "npm", ["run", "build"]);
runCommand("Dependency audit", "npm", ["audit", "--audit-level=moderate"]);
runCommand("Local browser/API smoke", "npm", ["run", "smoke:local"]);
runCommand("Diff whitespace check", "git", ["diff", "--check"]);
runUntrackedTextHygieneScan();
runPrivacyScan();

console.log("\nAutomated V1 release verification passed.");
console.log(
  "Manual external QA is still required for native OS picker visibility, Open Login, and real account-backed chat.",
);

function isReleaseScanPath(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  return releaseScanRoots.some((root) =>
    root.endsWith("/") ? normalized.startsWith(root) : normalized === root,
  );
}

function runUntrackedTextHygieneScan() {
  console.log("\n==> Untracked text hygiene scan");
  const result = spawnSync(
    "git",
    ["ls-files", "--others", "--exclude-standard", "-z"],
    {
      encoding: "buffer",
    },
  );

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  const files = result.stdout
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .filter((filePath) => isReleaseScanPath(filePath))
    .filter((filePath) => textFilePattern.test(filePath));
  const issues = [];

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (/[ \t]+$/.test(line)) {
        issues.push(`${filePath}:${index + 1}: trailing whitespace`);
      }
      if (/^(<<<<<<<|=======|>>>>>>>)(?:\s|$)/.test(line)) {
        issues.push(`${filePath}:${index + 1}: unresolved conflict marker`);
      }
    });

    if (content.length > 0 && !content.endsWith("\n")) {
      issues.push(`${filePath}: missing final newline`);
    }
  }

  if (issues.length > 0) {
    console.error(issues.join("\n"));
    process.exit(1);
  }

  console.log(
    files.length === 0
      ? "No untracked release text files found."
      : `Checked ${files.length} untracked release text file(s).`,
  );
}
