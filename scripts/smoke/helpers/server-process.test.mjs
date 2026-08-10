import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import {
  buildNextServerInvocation,
  stopChildProcess,
} from "./server-process.mjs";

const root = path.join("C:", "Repo", "app");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

assert.deepEqual(
  buildNextServerInvocation({ root, mode: "dev", port: 3001 }).args,
  [nextBin, "dev", "--webpack", "-H", "127.0.0.1", "-p", "3001"],
  "local smoke should start Next dev on localhost with webpack",
);

assert.deepEqual(
  buildNextServerInvocation({ root, mode: "start", port: 3002 }).args,
  [nextBin, "start", "-H", "127.0.0.1", "-p", "3002"],
  "production smoke should start the built app on localhost",
);

const longRunningChild = spawn(
  process.execPath,
  ["-e", "setInterval(() => {}, 1000)"],
  { stdio: "ignore" },
);
await stopChildProcess(longRunningChild);
assert.notEqual(
  longRunningChild.signalCode,
  null,
  "smoke cleanup should wait for a long-running child to terminate",
);

console.log("Smoke server process helper tests passed");
