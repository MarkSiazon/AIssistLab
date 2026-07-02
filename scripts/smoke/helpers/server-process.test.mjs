import assert from "node:assert/strict";
import path from "node:path";
import {
  buildNextServerInvocation,
  buildNpmDevServerInvocation,
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

assert.deepEqual(
  buildNpmDevServerInvocation({ port: 3003, platform: "win32" }),
  {
    command: "cmd.exe",
    args: [
      "/d",
      "/s",
      "/c",
      "npm run dev -- --hostname 127.0.0.1 --port 3003",
    ],
    windowsHide: true,
  },
  "safe-button smoke should start npm dev through cmd.exe on Windows",
);

assert.deepEqual(
  buildNpmDevServerInvocation({ port: 3004, platform: "linux" }),
  {
    command: "npm",
    args: ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3004"],
    windowsHide: false,
  },
  "safe-button smoke should start npm dev directly off Windows",
);

console.log("Smoke server process helper tests passed");
