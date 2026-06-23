import { spawn } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { assertNoUnsafe } from "./smoke/privacy-assertions.mjs";

const endpointPaths = [
  "/api/release/readiness",
  "/api/chat/status",
  "/api/settings/runtime",
  "/api/settings/claude-cli/profiles",
];

export const manualQaChecks = [
  {
    title: "Native folder picker",
    manualReason:
      "The OS folder picker is a native device dialog and must be visually confirmed by the local user.",
    steps: [
      "Open Settings and click Choose folder for WORKSPACE_ROOT or SKILLS_DIR.",
      "Confirm the native folder picker opens visibly.",
      "Cancel once and confirm the field is unchanged.",
      "Choose a harmless test folder and confirm the field shows Unsaved changes.",
    ],
    pass: "The browser stays responsive, cancel is non-destructive, and selected folders update only the intended field.",
  },
  {
    title: "Claude Open Login",
    manualReason:
      "The login action can open a private account-owned Claude auth flow, so automation must not click it.",
    steps: [
      "Open Settings and select the intended Claude profile.",
      "Click Open Login.",
      "Confirm a visible terminal or Claude auth window opens.",
      "Close or cancel the flow unless you intentionally want to authenticate.",
      "If you authenticated, run Test CLI and confirm the result is sanitized.",
    ],
    pass: "Login never runs silently, the launched auth UI is visible, and Settings does not show account identifiers or auth paths.",
  },
  {
    title: "Account-backed chat",
    manualReason:
      "A real chat sends a user-owned prompt through configured credentials and needs account approval.",
    steps: [
      "Choose the intended provider in Settings.",
      "For API mode, confirm an API key is configured locally without copying its value.",
      "For CLI mode, run Test CLI for the selected profile.",
      "Open Chat and ask the release-readiness demo prompt from the runbook.",
      "Confirm the answer cites the indexed skill and includes the expected readiness phrase.",
    ],
    pass: "Chat sends only after user action, provider errors are actionable, and Chat/Settings/Diagnostics stay sanitized.",
  },
];

export function normalizeBaseUrl(value) {
  const raw = (value || "http://localhost:3000").trim().replace(/\/+$/, "");
  try {
    const parsed = new URL(raw);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("unsupported protocol");
    }
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    throw new Error(
      `Invalid manual QA base URL: ${value || "(empty)"}. Set MANUAL_QA_BASE_URL, for example http://localhost:3000.`,
    );
  }
}

export function parseManualQaArgs(args = process.argv.slice(2), env = process.env) {
  const options = {
    baseUrl: env.MANUAL_QA_BASE_URL,
    startServer: env.MANUAL_QA_START_SERVER === "1",
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--start-server") {
      options.startServer = true;
      continue;
    }
    if (arg === "--base-url") {
      if (!args[index + 1] || args[index + 1].startsWith("--")) {
        throw new Error("Manual QA --base-url requires a URL value.");
      }
      options.baseUrl = args[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith("--base-url=")) {
      options.baseUrl = arg.slice("--base-url=".length);
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    throw new Error(`Unknown manual QA option: ${arg}`);
  }

  return options;
}

export function manualQaUsage() {
  return [
    "Usage:",
    "  npm run qa:manual",
    "  npm run qa:manual -- --base-url http://localhost:3000",
    "  npm run qa:manual:auto",
    "",
    "Options:",
    "  --base-url <url>     Read sanitized status from an already-running local app.",
    "  --start-server       Start a temporary localhost dev server, print the report, then stop it.",
  ].join("\n");
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

async function fetchWithTimeout(url, init = {}, timeoutMs = 2000) {
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

function nextDevCommand(port) {
  return {
    command: process.execPath,
    args: [
      path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next"),
      "dev",
      "--webpack",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
  };
}

async function waitForManualQaServer(baseUrl, child, logs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 90000) {
    if (child.exitCode !== null) {
      throw new Error(`Temporary dev server exited early.\n${logs.join("\n")}`);
    }
    try {
      const response = await fetchWithTimeout(`${baseUrl}/`, {
        headers: { host: new URL(baseUrl).host },
      });
      if (response.ok) return;
    } catch {
      // Still starting.
    }
    await delay(1000);
  }

  throw new Error(`Timed out waiting for temporary dev server.\n${logs.join("\n")}`);
}

async function withTemporaryManualQaServer(callback) {
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const { command, args } = nextDevCommand(port);
  const logs = [];
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  const pushLog = (chunk) => {
    for (const line of chunk.toString().split(/\r?\n/)) {
      if (!line.trim()) continue;
      logs.push(line);
    }
    while (logs.length > 60) logs.shift();
  };
  child.stdout.on("data", pushLog);
  child.stderr.on("data", pushLog);

  try {
    await waitForManualQaServer(baseUrl, child, logs);
    return await callback(baseUrl);
  } finally {
    child.kill("SIGTERM");
    await delay(500);
    if (child.exitCode === null) child.kill("SIGKILL");
  }
}

export async function fetchManualQaEndpoint(baseUrl, pathName, fetchImpl = fetch) {
  const url = new URL(pathName, `${baseUrl}/`);
  const response = await fetchImpl(url, {
    headers: {
      host: url.host,
    },
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  return {
    ok: response.ok,
    status: response.status,
    path: pathName,
    payload,
  };
}

export async function loadManualQaSnapshot(baseUrl, fetchImpl = fetch) {
  const entries = [];
  for (const pathName of endpointPaths) {
    entries.push(await fetchManualQaEndpoint(baseUrl, pathName, fetchImpl));
  }
  return entries;
}

export function assertManualQaSnapshotSafe(entries) {
  for (const entry of entries) {
    assertNoUnsafe(entry.path, entry.payload);
  }
}

function valueOrUnknown(value) {
  return typeof value === "string" && value.trim() ? value : "unknown";
}

function readinessLine(entries) {
  const entry = entries.find((candidate) => candidate.path === "/api/release/readiness");
  if (!entry?.ok || !entry.payload || typeof entry.payload !== "object") {
    return "Release readiness: unavailable";
  }
  const summary = entry.payload.summary ?? {};
  return `Release readiness: ${valueOrUnknown(summary.status)} (${typeof summary.score === "number" ? `${summary.score}/100` : "score unknown"})`;
}

function chatLine(entries) {
  const entry = entries.find((candidate) => candidate.path === "/api/chat/status");
  if (!entry?.ok || !entry.payload || typeof entry.payload !== "object") {
    return "Chat readiness: unavailable";
  }
  const ready = entry.payload.canSend === true ? "ready" : "blocked";
  const reason = entry.payload.blockingReason || entry.payload.suggestedAction;
  return `Chat readiness: ${ready}${reason ? ` (${reason})` : ""}`;
}

function runtimeLine(entries) {
  const entry = entries.find((candidate) => candidate.path === "/api/settings/runtime");
  if (!entry?.ok || !entry.payload || typeof entry.payload !== "object") {
    return "Runtime provider: unavailable";
  }
  const provider = entry.payload.provider ?? entry.payload.activeRuntime?.provider;
  const source = entry.payload.source ?? entry.payload.activeRuntime?.source;
  return `Runtime provider: ${valueOrUnknown(provider)} (${valueOrUnknown(source)} source)`;
}

function profilesLine(entries) {
  const entry = entries.find(
    (candidate) => candidate.path === "/api/settings/claude-cli/profiles",
  );
  if (!entry?.ok || !entry.payload || typeof entry.payload !== "object") {
    return "Claude profiles: unavailable";
  }
  const profiles = Array.isArray(entry.payload.profiles) ? entry.payload.profiles : [];
  const selected = profiles.some((profile) => profile.selected);
  return `Claude profiles: ${profiles.length} discovered${selected ? ", one selected" : ""}`;
}

export function formatManualQaReport(baseUrl, entries) {
  const failed = entries.filter((entry) => !entry.ok);
  const lines = [
    "# Manual External QA Helper",
    "",
    `Base URL: ${baseUrl}`,
    "",
    "## Sanitized Local Status",
    "",
    `- ${readinessLine(entries)}`,
    `- ${chatLine(entries)}`,
    `- ${runtimeLine(entries)}`,
    `- ${profilesLine(entries)}`,
    "",
  ];

  if (failed.length > 0) {
    lines.push(
      "Endpoint warnings:",
      ...failed.map((entry) => `- ${entry.path} returned HTTP ${entry.status}`),
      "",
    );
  }

  lines.push(
    "## Evidence Tracking",
    "",
    "Use the Settings Manual QA Evidence panel to mark each check as Passed, Needs fix, or Pending after you run it.",
    "The panel stores only status and timestamp in this browser. This helper does not write evidence files.",
    "",
    "## Manual Checks To Finish",
    "",
    ...manualQaChecks.flatMap((check, index) => [
      `${index + 1}. ${check.title}`,
      `   - Manual because: ${check.manualReason}`,
      ...check.steps.map((step) => `   - ${step}`),
      `   - Pass: ${check.pass}`,
      "",
    ]),
    "Do not record API keys, account emails, organization names, OAuth paths, full home paths, or raw Claude profile folders in QA notes.",
  );

  return lines.join("\n");
}

export async function runManualQaHelper({
  baseUrl = normalizeBaseUrl(process.env.MANUAL_QA_BASE_URL),
  fetchImpl = fetch,
} = {}) {
  const entries = await loadManualQaSnapshot(baseUrl, fetchImpl);
  assertManualQaSnapshotSafe(entries);
  return formatManualQaReport(baseUrl, entries);
}

export async function runManualQaCli(options = parseManualQaArgs()) {
  if (options.help) return manualQaUsage();
  if (options.startServer) {
    return await withTemporaryManualQaServer((baseUrl) =>
      runManualQaHelper({ baseUrl }),
    );
  }

  return await runManualQaHelper({
    baseUrl: normalizeBaseUrl(options.baseUrl),
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runManualQaCli()
    .then((report) => {
      console.log(report);
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      console.error("");
      console.error("Start the local app with `npm run dev`, or run:");
      console.error("  npm run qa:manual:auto");
      process.exit(1);
    });
}
