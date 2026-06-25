import { createServer } from "node:net";

export async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

export function pushLog(lines, chunk, maxLines = 80) {
  const text = chunk.toString();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    lines.push(line);
  }
  while (lines.length > maxLines) lines.shift();
}

export async function fetchWithTimeout(url, init = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function waitForServerReady({
  baseUrl,
  child,
  logs,
  probePath = "/",
  serverName = "server",
  timeoutMs = 90000,
  probeTimeoutMs = 2000,
}) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (child.exitCode !== null) {
      throw new Error(`Next ${serverName} exited early.\n${logs.join("\n")}`);
    }
    try {
      const response = await fetchWithTimeout(
        `${baseUrl}${probePath}`,
        { headers: { host: new URL(baseUrl).host } },
        probeTimeoutMs,
      );
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for Next ${serverName}.\n${logs.join("\n")}`);
}
