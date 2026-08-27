import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { buildCommandInvocation } from "./command.mjs";

assert.deepEqual(
  buildCommandInvocation(
    "npm",
    ["run", "test"],
    "win32",
    "C:\\Program Files\\nodejs\\node.exe",
  ),
  {
    command: "C:\\Program Files\\nodejs\\node.exe",
    args: [
      "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js",
      "run",
      "test",
    ],
  },
  "Windows npm commands should invoke npm-cli.js without a command shell",
);

assert.deepEqual(
  buildCommandInvocation("git", ["diff", "--check"], "win32"),
  {
    command: "git",
    args: ["diff", "--check"],
  },
  "non-npm commands should keep their direct executable on Windows",
);

assert.deepEqual(
  buildCommandInvocation("npm", ["test"], "linux"),
  {
    command: "npm",
    args: ["test"],
  },
  "non-Windows npm commands should run directly",
);

assert.throws(
  () => buildCommandInvocation("powershell", ["-Command", "Write-Output unsafe"]),
  /Unsupported release command/,
  "release commands should reject executables outside the fixed allowlist",
);

if (process.platform === "win32") {
  const invocation = buildCommandInvocation("npm", ["--version"]);
  const result = spawnSync(invocation.command, invocation.args, {
    encoding: "utf8",
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /^\d+\.\d+\.\d+/);
}

console.log("Command helper tests passed");
