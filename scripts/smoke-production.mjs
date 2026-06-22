import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { stat } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";
import { assertNoUnsafe } from "./smoke/privacy-assertions.mjs";

const root = process.cwd();
const demoWorkspace = path.join(root, "examples", "demo-workspace");
const buildIdPath = path.join(root, ".next", "BUILD_ID");
const routeNavigationTimeoutMs = 60000;
const productionDeviceBlockMessage =
  "Local device access is disabled in production mode.";
const productionCliBlockMessage =
  "Local Claude CLI is disabled in production mode.";

const localDeviceApiChecks = [
  ["/api/chat/status"],
  ["/api/index"],
  ["/api/index", { method: "POST" }],
  ["/api/release/readiness"],
  ["/api/settings"],
  ["/api/settings", { method: "POST", body: "{}" }],
  ["/api/settings/doctor"],
  ["/api/settings/runtime"],
  ["/api/settings/claude-project"],
  ["/api/settings/path-exists?path=."],
  ["/api/settings/browse?path=."],
  ["/api/settings/browse/search?q=demo"],
  ["/api/settings/native-folder"],
  ["/api/skills"],
  ["/api/skills/templates"],
  ["/api/skills/validation"],
  ["/api/skills/browser-smoke-skill"],
  ["/api/skills/import/preview", { method: "POST", body: "{}" }],
  ["/api/skills/import/apply", { method: "POST", body: "{}" }],
  ["/api/export"],
  ["/api/export/zip?diagnostics=true"],
];
const localCliApiChecks = [
  ["/api/settings/claude-cli"],
  ["/api/settings/claude-cli", { method: "POST", body: "{}" }],
  ["/api/settings/claude-cli/profiles"],
  ["/api/settings/claude-cli/test", { method: "POST", body: "{}" }],
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function exists(filePath) {
  return Boolean(await stat(filePath).catch(() => null));
}

async function getFreePort() {
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

function pushLog(lines, chunk) {
  const text = chunk.toString();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    lines.push(line);
  }
  while (lines.length > 80) lines.shift();
}

async function waitForServer(baseUrl, child, logs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 90000) {
    if (child.exitCode !== null) {
      throw new Error(`Next production server exited early.\n${logs.join("\n")}`);
    }
    try {
      const response = await fetchWithTimeout(`${baseUrl}/`, {
        headers: { host: new URL(baseUrl).host },
      }, 2000);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await delay(1000);
  }
  throw new Error(`Timed out waiting for Next production server.\n${logs.join("\n")}`);
}

async function fetchWithTimeout(url, init = {}, timeoutMs = 30000) {
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

async function expectForbiddenLocalApi(
  baseUrl,
  pathName,
  expectedMessage,
  init = {},
) {
  const response = await fetchWithTimeout(`${baseUrl}${pathName}`, {
    ...init,
    headers: {
      host: new URL(baseUrl).host,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  assert(response.status === 403, `${pathName} should be production-guarded.`);
  const serializedPayload = JSON.stringify(payload);
  assert(
    serializedPayload.includes(expectedMessage),
    `${pathName} should explain that local device access is disabled in production.`,
  );
  assertNoUnsafe(`${pathName} forbidden response`, serializedPayload);
}

async function expectProductionChatMissingKeyStream(baseUrl) {
  const response = await fetchWithTimeout(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: {
      host: new URL(baseUrl).host,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: "Summarize release readiness from the indexed demo skills.",
    }),
  });
  const body = await response.text();

  assert(response.status === 200, "/api/chat should return a stream response.");
  assert(
    /text\/event-stream/.test(response.headers.get("content-type") ?? ""),
    "/api/chat should return an event-stream content type.",
  );
  assert(/"type":"citations"/.test(body), "/api/chat should stream citations first.");
  assert(
    /"type":"error"/.test(body),
    "/api/chat should stream a provider error when API key is missing.",
  );
  assert(
    /ANTHROPIC_API_KEY is not configured/.test(body),
    "/api/chat missing-key error should be actionable.",
  );
  assertNoUnsafe("/api/chat missing-key stream", body);
}

async function runApiSmoke(baseUrl) {
  for (const [pathName, init] of localDeviceApiChecks) {
    await expectForbiddenLocalApi(
      baseUrl,
      pathName,
      productionDeviceBlockMessage,
      init,
    );
  }

  for (const [pathName, init] of localCliApiChecks) {
    await expectForbiddenLocalApi(
      baseUrl,
      pathName,
      productionCliBlockMessage,
      init,
    );
  }

  await expectProductionChatMissingKeyStream(baseUrl);
}

async function expectPageText(page, baseUrl, route, text) {
  await page.goto(`${baseUrl}${route}`, {
    waitUntil: "networkidle",
    timeout: routeNavigationTimeoutMs,
  });
  await page.getByText(text, { exact: false }).first().waitFor({
    state: "visible",
    timeout: routeNavigationTimeoutMs,
  });
}

function attachBrowserIssueTracking(page, browserIssues) {
  page.on("pageerror", (error) => {
    browserIssues.push(`pageerror: ${error.stack || error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      if (/Failed to load resource: .*status of 403/.test(text)) return;
      browserIssues.push(`console: ${text}`);
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 500) {
      browserIssues.push(`http ${response.status()}: ${response.url()}`);
    }
  });
}

async function runBrowserSmoke(baseUrl) {
  const browser = await chromium.launch({
    headless: process.env.SMOKE_HEADLESS !== "false",
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 920 } });
  page.setDefaultNavigationTimeout(routeNavigationTimeoutMs);
  page.setDefaultTimeout(routeNavigationTimeoutMs);
  const browserIssues = [];
  attachBrowserIssueTracking(page, browserIssues);

  try {
    await expectPageText(page, baseUrl, "/", "Library Readiness");
    await expectPageText(page, baseUrl, "/settings", "V1 Release Readiness");
    await expectPageText(page, baseUrl, "/skills", "Library Readiness");
    await expectPageText(page, baseUrl, "/chat", "Chat Readiness");
    await expectPageText(page, baseUrl, "/export", "Export Skills");
    await expectPageText(page, baseUrl, "/editor", "New Skill");
    await expectPageText(page, baseUrl, "/editor/guided", "Guided Skill Builder");
    assert(
      browserIssues.length === 0,
      `Production browser issues:\n${browserIssues.join("\n")}`,
    );
  } finally {
    await browser.close();
  }
}

async function main() {
  assert(await exists(buildIdPath), "Production build missing. Run npm run build first.");
  assert(await exists(demoWorkspace), "examples/demo-workspace was not found.");

  const port = Number(process.env.SMOKE_PORT) || (await getFreePort());
  const baseUrl = `http://127.0.0.1:${port}`;
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  const logs = [];
  const child = spawn(
    process.execPath,
    [nextBin, "start", "-H", "127.0.0.1", "-p", String(port)],
    {
      cwd: root,
      env: {
        ...process.env,
        WORKSPACE_ROOT: demoWorkspace,
        SKILLS_DIR: ".claude/skills",
        NEXT_PUBLIC_APP_TITLE: "Skill Workshop RAG",
        LLM_PROVIDER: "anthropic_api",
        ENABLE_LOCAL_CLAUDE_CLI: "false",
        CLAUDE_CLI_PATH: "auto",
        CLAUDE_LOGIN_COMMAND: "auto",
        CLAUDE_CONFIG_DIR: "",
        ANTHROPIC_API_KEY: "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stdout.on("data", (chunk) => pushLog(logs, chunk));
  child.stderr.on("data", (chunk) => pushLog(logs, chunk));

  try {
    await waitForServer(baseUrl, child, logs);
    await runApiSmoke(baseUrl);
    await runBrowserSmoke(baseUrl);
    console.log(`Production smoke passed at ${baseUrl}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    console.error("\nRecent server output:");
    console.error(logs.join("\n"));
    process.exitCode = 1;
  } finally {
    child.kill("SIGTERM");
    await delay(500);
    if (!child.killed && child.exitCode === null) child.kill("SIGKILL");
  }
}

await main();
