#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

const INFRASTRUCTURE_PATTERNS = [
  /@openai[\\/]codex/i,
  /@modelcontextprotocol[\\/]server-filesystem/i,
  /chrome-devtools-mcp/i,
  /@playwright[\\/]mcp/i,
  /@upstash[\\/]context7-mcp/i,
  /context7-mcp/i,
];

const PROJECT_COMMAND_PATTERNS = [
  /[\\/]next[\\/]dist[\\/]bin[\\/]next\b/i,
  /[\\/]scripts[\\/]smoke-local\.mjs\b/i,
  /[\\/]scripts[\\/]smoke-buttons\.mjs\b/i,
  /[\\/]scripts[\\/]smoke-production\.mjs\b/i,
  /[\\/]scripts[\\/]verify-release\.mjs\b/i,
  /[\\/]scripts[\\/]run-tests\.mjs\b/i,
  /[\\/]scripts[\\/]manual-external-qa\.mjs\b/i,
];

const SAFE_WRAPPER_PATTERNS = [
  /\bcmd\.exe"?\s+\/c\s+npm\s+run\s+(?:dev|start|test|smoke:local|smoke:buttons|smoke:production|qa:manual(?::auto)?|verify:release)\b/i,
  /\bnpm-cli\.js"?\s+run\s+(?:dev|start|test|smoke:local|smoke:buttons|smoke:production|qa:manual(?::auto)?|verify:release)\b/i,
  /\bcmd\.exe\b.*\bnext\s+(?:dev|start)\b/i,
];

function normalizePathLike(value) {
  return String(value ?? "")
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .toLowerCase();
}

function normalizeRootPath(value) {
  const normalized = normalizePathLike(value);
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

function isPathStartBoundary(value, index) {
  if (index === 0) return true;
  return /[\s"'=]/.test(value[index - 1] ?? "");
}

function isPathEndBoundary(value, index) {
  const character = value[index];
  return character === undefined || /[\s"'/?#]/.test(character);
}

function commandContainsRepoRootPath(commandLine, root) {
  const normalizedCommand = normalizePathLike(commandLine);
  const normalizedRoot = normalizeRootPath(root);

  let index = normalizedCommand.indexOf(normalizedRoot);
  while (index !== -1) {
    const endIndex = index + normalizedRoot.length;
    if (
      isPathStartBoundary(normalizedCommand, index) &&
      isPathEndBoundary(normalizedCommand, endIndex)
    ) {
      return true;
    }

    index = normalizedCommand.indexOf(normalizedRoot, index + 1);
  }

  return false;
}

function normalizeProcess(raw) {
  return {
    pid: Number(raw.ProcessId ?? raw.processId ?? raw.pid),
    parentPid: Number(
      raw.ParentProcessId ?? raw.parentProcessId ?? raw.parentPid ?? raw.ppid ?? 0,
    ),
    name: String(raw.Name ?? raw.name ?? ""),
    commandLine: String(raw.CommandLine ?? raw.commandLine ?? ""),
  };
}

export function isInfrastructureProcess(commandLine) {
  return INFRASTRUCTURE_PATTERNS.some((pattern) => pattern.test(commandLine));
}

export function isProjectOwnedProcess(processInfo, root = repoRoot) {
  const commandLine = processInfo.commandLine ?? "";
  if (!commandLine || isInfrastructureProcess(commandLine)) return false;

  const normalizedCommand = normalizePathLike(commandLine);
  if (!commandContainsRepoRootPath(commandLine, root)) return false;

  return PROJECT_COMMAND_PATTERNS.some((pattern) => pattern.test(normalizedCommand));
}

export function isSafeWrapperProcess(processInfo) {
  const commandLine = processInfo.commandLine ?? "";
  if (!commandLine || isInfrastructureProcess(commandLine)) return false;
  return SAFE_WRAPPER_PATTERNS.some((pattern) => pattern.test(commandLine));
}

function collectDescendantPids(rootPid, byParentPid) {
  const descendants = new Set();
  const stack = [...(byParentPid.get(rootPid) ?? [])];

  while (stack.length > 0) {
    const processInfo = stack.pop();
    if (!processInfo || descendants.has(processInfo.pid)) continue;
    descendants.add(processInfo.pid);
    stack.push(...(byParentPid.get(processInfo.pid) ?? []));
  }

  return descendants;
}

export function buildProjectCleanupPlan(rawProcesses, options = {}) {
  const currentPid = Number(options.currentPid ?? process.pid);
  const root = options.repoRoot ?? repoRoot;
  const processes = rawProcesses
    .map(normalizeProcess)
    .filter((processInfo) => Number.isFinite(processInfo.pid));

  const byParentPid = new Map();
  const byPid = new Map();
  for (const processInfo of processes) {
    byPid.set(processInfo.pid, processInfo);
    const siblings = byParentPid.get(processInfo.parentPid) ?? [];
    siblings.push(processInfo);
    byParentPid.set(processInfo.parentPid, siblings);
  }

  const matched = processes.filter(
    (processInfo) =>
      processInfo.pid !== currentPid && isProjectOwnedProcess(processInfo, root),
  );
  const stoppablePids = new Set(matched.map((processInfo) => processInfo.pid));

  for (const processInfo of matched) {
    let ancestor = byPid.get(processInfo.parentPid);
    while (
      ancestor &&
      ancestor.pid !== currentPid &&
      isSafeWrapperProcess(ancestor)
    ) {
      stoppablePids.add(ancestor.pid);
      ancestor = byPid.get(ancestor.parentPid);
    }
  }

  const stoppable = processes.filter((processInfo) => stoppablePids.has(processInfo.pid));
  const rootMatches = stoppable.filter(
    (processInfo) => !stoppablePids.has(processInfo.parentPid),
  );
  const descendantPids = new Set();
  for (const processInfo of rootMatches) {
    for (const descendantPid of collectDescendantPids(processInfo.pid, byParentPid)) {
      descendantPids.add(descendantPid);
    }
  }
  const stopPids = [...new Set(rootMatches.map((processInfo) => processInfo.pid))].sort(
    (left, right) => left - right,
  );

  return {
    matched,
    rootMatches,
    stopPids,
    descendantPids: [...descendantPids].sort((left, right) => left - right),
  };
}

function runPowerShell(command, args = []) {
  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command, ...args],
    {
      encoding: "utf8",
      windowsHide: true,
    },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "PowerShell command failed").trim());
  }

  return result.stdout;
}

export function parseWindowsProcessList(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      const [processId, parentProcessId, name, encodedCommandLine = ""] =
        line.split("\t");
      const commandLine = Buffer.from(encodedCommandLine, "base64").toString("utf8");
      return normalizeProcess({
        ProcessId: processId,
        ParentProcessId: parentProcessId,
        Name: name,
        CommandLine: commandLine,
      });
    });
}

async function listWindowsProcesses() {
  const output = runPowerShell(
    [
      "Get-CimInstance Win32_Process | ForEach-Object {",
      "  $command = [string]$_.CommandLine",
      "  $encoded = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($command))",
      '  "{0}`t{1}`t{2}`t{3}" -f $_.ProcessId,$_.ParentProcessId,$_.Name,$encoded',
      "}",
    ].join("\n"),
  );
  return parseWindowsProcessList(output);
}

export function buildStopWindowsProcessTreesCommand(stopPids) {
  const ids = stopPids
    .map((pid) => Number(pid))
    .filter((pid) => Number.isInteger(pid) && pid > 0);
  const idList = ids.join(",");

  return [
    "function Stop-ProjectTree([int]$RootProcessId) {",
    "  $children = Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq $RootProcessId }",
    "  foreach ($child in $children) { Stop-ProjectTree ([int]$child.ProcessId) }",
    "  Stop-Process -Id $RootProcessId -Force -ErrorAction SilentlyContinue",
    "}",
    `foreach ($id in @(${idList})) { Stop-ProjectTree ([int]$id) }`,
  ].join("\n");
}

function stopWindowsProcessTrees(stopPids) {
  if (stopPids.length === 0) return;

  runPowerShell(buildStopWindowsProcessTreesCommand(stopPids));
}

function formatProcess(processInfo) {
  const command = processInfo.commandLine.replace(/\s+/g, " ").trim();
  return `${processInfo.pid} ${processInfo.name}: ${command}`;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run") || args.has("--list");
  const confirmed = args.has("--yes");

  if (process.platform !== "win32") {
    console.log("Project process cleanup is currently implemented for Windows only.");
    return;
  }

  if (!dryRun && !confirmed) {
    throw new Error("Refusing to stop processes without --yes. Use --dry-run to inspect.");
  }

  const processes = await listWindowsProcesses();
  const plan = buildProjectCleanupPlan(processes, {
    currentPid: process.pid,
    repoRoot,
  });

  if (plan.rootMatches.length === 0) {
    console.log(
      "No repo-owned Next, smoke, test, release, or manual QA helper processes were found.",
    );
    return;
  }

  console.log(
    `${dryRun ? "Would stop" : "Stopping"} ${plan.rootMatches.length} repo-owned process tree(s):`,
  );
  for (const processInfo of plan.rootMatches) {
    console.log(`- ${formatProcess(processInfo)}`);
  }

  if (dryRun) {
    console.log("Dry run only. No processes were stopped.");
    return;
  }

  stopWindowsProcessTrees(plan.stopPids);
  console.log("Project process cleanup complete.");
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
}
