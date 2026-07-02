import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { pushLog } from "../../lib/server-utils.mjs";

export function buildNextServerInvocation({ root, mode, port }) {
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  const args =
    mode === "dev"
      ? [nextBin, "dev", "--webpack", "-H", "127.0.0.1", "-p", String(port)]
      : [nextBin, "start", "-H", "127.0.0.1", "-p", String(port)];
  return { command: process.execPath, args };
}

export function buildNpmDevServerInvocation({
  port,
  platform = process.platform,
}) {
  if (platform === "win32") {
    return {
      command: "cmd.exe",
      args: [
        "/d",
        "/s",
        "/c",
        `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
      ],
      windowsHide: true,
    };
  }

  return {
    command: "npm",
    args: ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port)],
    windowsHide: false,
  };
}

export function startNextServer({
  root = process.cwd(),
  mode,
  port,
  env = process.env,
}) {
  const logs = [];
  const invocation = buildNextServerInvocation({ root, mode, port });
  const child = spawn(invocation.command, invocation.args, {
    cwd: root,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => pushLog(logs, chunk));
  child.stderr.on("data", (chunk) => pushLog(logs, chunk));
  return { child, logs };
}

export function startNpmDevServer({
  cwd = process.cwd(),
  port,
  env = process.env,
}) {
  const logs = [];
  const invocation = buildNpmDevServerInvocation({ port });
  const child = spawn(invocation.command, invocation.args, {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: invocation.windowsHide,
  });

  child.stdout.on("data", (chunk) => pushLog(logs, chunk));
  child.stderr.on("data", (chunk) => pushLog(logs, chunk));
  return { child, logs };
}

export async function stopChildProcess(child, { killTreeOnWindows = false } = {}) {
  if (!child || child.exitCode !== null) return;

  if (killTreeOnWindows && process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
    });
    return;
  }

  child.kill("SIGTERM");
  await delay(500);
  if (!child.killed && child.exitCode === null) child.kill("SIGKILL");
}
