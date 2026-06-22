import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildStopWindowsProcessTreesCommand,
  buildProjectCleanupPlan,
  isInfrastructureProcess,
  isProjectOwnedProcess,
  isSafeWrapperProcess,
  parseWindowsProcessList,
} from "./cleanup-project-processes.mjs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const verifyReleaseSource = readFileSync("scripts/verify-release.mjs", "utf8");
const repoRoot = "C:/Repos/Skill Workshop/rag-interface";

assert.equal(
  packageJson.scripts["cleanup:project:dry-run"],
  "node scripts/cleanup-project-processes.mjs --dry-run",
  "package.json must expose the project cleanup dry-run helper",
);
assert.match(
  verifyReleaseSource,
  /Project process cleanup dry run preflight/,
  "verify:release must run the project cleanup dry-run preflight",
);
assert.match(
  verifyReleaseSource,
  /Project process cleanup dry run postflight/,
  "verify:release must run the project cleanup dry-run postflight",
);

function processInfo(pid, parentPid, commandLine, name = "node.exe") {
  return {
    pid,
    parentPid,
    name,
    commandLine,
  };
}

assert.equal(
  isInfrastructureProcess(
    "node D:/Tooling/example/AppData/Roaming/npm/node_modules/@openai/codex/bin/codex.js",
  ),
  true,
  "Codex infrastructure must be excluded",
);

assert.equal(
  isInfrastructureProcess(
    "node D:/Tooling/example/AppData/Local/npm-cache/_npx/pkg/node_modules/.bin/../@playwright/mcp/cli.js",
  ),
  true,
  "Playwright MCP infrastructure must be excluded",
);

assert.equal(
  isProjectOwnedProcess(
    processInfo(
      10,
      1,
      "node C:/Repos/Skill Workshop/rag-interface/node_modules/.bin/../next/dist/bin/next dev --webpack --port 3000",
    ),
    repoRoot,
  ),
  true,
  "Repo-owned Next dev process should be detected",
);

assert.equal(
  isProjectOwnedProcess(
    processInfo(
      11,
      1,
      "node C:/Other/rag-interface/node_modules/.bin/../next/dist/bin/next dev --webpack --port 3000",
    ),
    repoRoot,
  ),
  false,
  "Similar command in another repo must not be detected",
);

assert.equal(
  isProjectOwnedProcess(
    processInfo(
      12,
      1,
      "node C:/Repos/Skill Workshop/rag-interface/scripts/smoke-local.mjs",
    ),
    repoRoot,
  ),
  true,
  "Repo-owned smoke runner should be detected",
);

assert.equal(
  isProjectOwnedProcess(
    processInfo(
      13,
      1,
      "node C:/Repos/Skill Workshop/rag-interface/node_modules/@openai/codex/bin/codex.js",
    ),
    repoRoot,
  ),
  false,
  "Codex command under the repo root must remain excluded",
);

assert.equal(
  isSafeWrapperProcess(
    processInfo(
      14,
      1,
      '"C:/Windows/System32/cmd.exe" /c npm run dev -- --hostname 127.0.0.1 --port 3000',
      "cmd.exe",
    ),
  ),
  true,
  "npm run dev wrapper should be stoppable only when linked to a matched child",
);

assert.equal(
  isSafeWrapperProcess(
    processInfo(15, 1, '"C:/Windows/System32/cmd.exe" /c git status', "cmd.exe"),
  ),
  false,
  "Unrelated command wrappers must not be treated as safe cleanup roots",
);

const plan = buildProjectCleanupPlan(
  [
    processInfo(
      20,
      1,
      "node C:/Repos/Skill Workshop/rag-interface/scripts/smoke-production.mjs",
    ),
    processInfo(
      21,
      20,
      "node C:/Repos/Skill Workshop/rag-interface/node_modules/.bin/../next/dist/bin/next start",
    ),
    processInfo(22, 21, "node child-worker.js"),
    processInfo(
      30,
      1,
      "node C:/Repos/Skill Workshop/rag-interface/scripts/cleanup-project-processes.mjs",
    ),
  ],
  {
    currentPid: 30,
    repoRoot,
  },
);

assert.deepEqual(
  plan.stopPids,
  [20],
  "Cleanup should stop only the top repo-owned process tree root",
);
assert.deepEqual(
  plan.descendantPids,
  [21, 22],
  "Cleanup should include descendants through process-tree stopping",
);

const wrapperPlan = buildProjectCleanupPlan(
  [
    processInfo(
      50,
      1,
      '"C:/Windows/System32/cmd.exe" /c npm run dev -- --hostname 127.0.0.1 --port 3000',
      "cmd.exe",
    ),
    processInfo(
      51,
      50,
      '"C:/Program Files/nodejs/node.exe" "D:/Tooling/npm/bin/npm-cli.js" run dev -- --hostname 127.0.0.1 --port 3000',
    ),
    processInfo(
      52,
      51,
      "C:/Windows/System32/cmd.exe /d /s /c next dev --webpack --hostname 127.0.0.1 --port 3000",
      "cmd.exe",
    ),
    processInfo(
      53,
      52,
      "node C:/Repos/Skill Workshop/rag-interface/node_modules/.bin/../next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3000",
    ),
    processInfo(54, 53, "node next-worker.js"),
  ],
  {
    currentPid: 999,
    repoRoot,
  },
);

assert.deepEqual(
  wrapperPlan.stopPids,
  [50],
  "Cleanup should stop the highest safe npm/cmd wrapper when a child is repo-owned",
);
assert.deepEqual(
  wrapperPlan.descendantPids,
  [51, 52, 53, 54],
  "Wrapper cleanup should report the whole descendant process tree",
);

const emptyPlan = buildProjectCleanupPlan(
  [
    processInfo(
      40,
      1,
      "node D:/Tooling/example/AppData/Roaming/npm/node_modules/@openai/codex/bin/codex.js",
    ),
    processInfo(
      41,
      1,
      "node D:/Tooling/example/AppData/Local/npm-cache/_npx/pkg/node_modules/.bin/../chrome-devtools-mcp/build/src/bin/chrome-devtools-mcp.js",
    ),
  ],
  {
    currentPid: 999,
    repoRoot,
  },
);

assert.deepEqual(
  emptyPlan.stopPids,
  [],
  "Cleanup must no-op when only Codex/MCP infrastructure is present",
);

const stopCommand = buildStopWindowsProcessTreesCommand([50, 51]);
assert.match(
  stopCommand,
  /foreach \(\$id in @\(50,51\)\)/,
  "PowerShell stop command should embed sanitized root PIDs",
);
assert.doesNotMatch(
  stopCommand,
  /\$args/,
  "PowerShell stop command must not rely on forwarded -Command arguments",
);

const encodedCommand = Buffer.from(
  '"node" "C:/Repos/Skill Workshop/rag-interface/node_modules/.bin/../next/dist/bin/next" dev --webpack',
  "utf8",
).toString("base64");
assert.deepEqual(
  parseWindowsProcessList(`70\t20\tnode.exe\t${encodedCommand}\r\n`),
  [
    {
      pid: 70,
      parentPid: 20,
      name: "node.exe",
      commandLine:
        '"node" "C:/Repos/Skill Workshop/rag-interface/node_modules/.bin/../next/dist/bin/next" dev --webpack',
    },
  ],
  "Windows process parser should decode base64 command lines without JSON",
);

console.log("Project process cleanup tests passed");
