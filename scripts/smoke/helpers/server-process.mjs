import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
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

export async function stopChildProcess(child, { killTreeOnWindows = false } = {}) {
  if (!child || child.exitCode !== null) return;

  const waitForExit = async (timeoutMs) => {
    if (child.exitCode !== null || child.signalCode !== null) return true;
    await Promise.race([
      once(child, "exit"),
      delay(timeoutMs).then(() => null),
    ]);
    return child.exitCode !== null || child.signalCode !== null;
  };

  if (killTreeOnWindows && process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
    });
    await waitForExit(2000);
    return;
  }

  child.kill("SIGTERM");
  if (await waitForExit(500)) return;

  child.kill("SIGKILL");
  await waitForExit(2000);
}
