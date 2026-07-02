import assert from "node:assert/strict";
import { buildCommandInvocation } from "./command.mjs";

assert.deepEqual(
  buildCommandInvocation("npm", ["run", "test"], "win32"),
  {
    command: "cmd.exe",
    args: ["/d", "/s", "/c", "npm run test"],
  },
  "Windows npm commands should run through cmd.exe so npm.cmd resolution is stable",
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

console.log("Command helper tests passed");
