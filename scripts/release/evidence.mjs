import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

export const releaseGateCoverage = [
  "project cleanup dry-run preflight",
  "full test sweep",
  "lint",
  "production build",
  "production server smoke",
  "dependency audit",
  "local browser/API smoke",
  "safe button smoke",
  "manual QA helper auto smoke",
  "project cleanup dry-run postflight",
  "local artifact cleanup dry-run postflight",
  "asset usage audit",
  "documentation link audit",
  "dead-code audit",
  "unused-export audit",
  "diff whitespace check",
  "untracked release-text hygiene",
  "privacy scan",
];

export const pendingManualGates = [
  "Native OS folder picker visibility, cancel behavior, and harmless folder selection.",
  "Visible Claude Open Login launch under user control.",
  "Provider auth test for the intended local provider/profile.",
  "First real account-backed chat.",
  "Sanitization review of Settings, Chat, and Diagnostics during the manual session.",
];

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) return "";
  return result.stdout.trim();
}

function collectTestFiles(directory, suffix) {
  if (!existsSync(directory)) return [];

  const entries = readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(fullPath, suffix));
    } else if (entry.isFile() && entry.name.endsWith(suffix)) {
      files.push(fullPath);
    }
  }

  return files;
}

function countReleaseTestFiles() {
  return (
    collectTestFiles(path.join(repoRoot, "src"), ".test.ts").length +
    collectTestFiles(path.join(repoRoot, "scripts"), ".test.mjs").length
  );
}

function parseArgs(argv) {
  const options = {
    format: "markdown",
    gateResult: "not_run",
    output: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      options.format = "json";
    } else if (arg === "--markdown") {
      options.format = "markdown";
    } else if (arg === "--gate-result") {
      options.gateResult = argv[index + 1] ?? "not_run";
      index += 1;
    } else if (arg === "--output") {
      options.output = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === "--help") {
      options.help = true;
    } else {
      throw new Error(`Unknown release evidence option: ${arg}`);
    }
  }

  return options;
}

export function buildReleaseEvidence({
  generatedAt = new Date().toISOString(),
  gateResult = "not_run",
  gitStatus = runGit(["status", "--short", "--branch"]),
  commit = runGit(["rev-parse", "--short", "HEAD"]),
  testFileCount = countReleaseTestFiles(),
} = {}) {
  const branchLine = gitStatus.split(/\r?\n/)[0] || "unknown";
  const changedFileCount = gitStatus
    .split(/\r?\n/)
    .slice(1)
    .filter(Boolean).length;

  return {
    schemaVersion: 1,
    generatedAt,
    branch: branchLine.replace(/^##\s*/, ""),
    commit,
    workingTree: changedFileCount === 0 ? "clean" : "changes present",
    changedFileCount,
    automatedGate: {
      command: "npm run verify:release",
      result: gateResult,
      testFileCount,
      coverage: releaseGateCoverage,
    },
    privacyScan: {
      result:
        gateResult === "passed"
          ? "passed as part of npm run verify:release"
          : "not run by this evidence command",
    },
    manualStatus: {
      result: "pending",
      pendingGates: pendingManualGates,
    },
  };
}

export function formatReleaseEvidenceMarkdown(evidence) {
  return [
    "# V1 Release Evidence",
    "",
    `Generated: ${evidence.generatedAt}`,
    `Branch: \`${evidence.branch}\``,
    `Commit: \`${evidence.commit || "unknown"}\``,
    `Working tree: ${evidence.workingTree} (${evidence.changedFileCount} changed file${evidence.changedFileCount === 1 ? "" : "s"})`,
    "",
    "## Automated Gate",
    "",
    `- Command: \`${evidence.automatedGate.command}\``,
    `- Result: ${evidence.automatedGate.result}`,
    `- Test files: ${evidence.automatedGate.testFileCount}`,
    `- Privacy scan: ${evidence.privacyScan.result}`,
    "",
    "Coverage:",
    ...evidence.automatedGate.coverage.map((item) => `- ${item}`),
    "",
    "## Manual Gates Still Pending",
    "",
    ...evidence.manualStatus.pendingGates.map((item) => `- ${item}`),
    "",
  ].join("\n");
}

function usage() {
  return [
    "Usage:",
    "  node scripts/release/evidence.mjs [--markdown|--json] [--gate-result passed|failed|not_run] [--output path]",
  ].join("\n");
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const evidence = buildReleaseEvidence({ gateResult: options.gateResult });
  const output =
    options.format === "json"
      ? `${JSON.stringify(evidence, null, 2)}\n`
      : formatReleaseEvidenceMarkdown(evidence);

  if (options.output) {
    writeFileSync(path.resolve(repoRoot, options.output), output, "utf8");
  } else {
    process.stdout.write(output);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
