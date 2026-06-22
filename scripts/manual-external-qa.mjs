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
    "## Manual Checks To Finish",
    "",
    ...manualQaChecks.flatMap((check, index) => [
      `${index + 1}. ${check.title}`,
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

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runManualQaHelper()
    .then((report) => {
      console.log(report);
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      console.error("");
      console.error("Start the local app with `npm run dev`, then rerun:");
      console.error("  npm run qa:manual");
      process.exit(1);
    });
}
