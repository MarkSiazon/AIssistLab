import assert from "node:assert/strict";
import {
  buildChatEmptyStateCopy,
  buildChatReadinessRows,
  buildChatStatusChips,
  indexSuggestedAction,
  type ChatReadinessStatus,
} from "./chat-readiness-panel";

const readyStatus: ChatReadinessStatus = {
  provider: "anthropic_api",
  runtimeSource: "runtime",
  canSend: true,
  blockingReason: null,
  suggestedAction: null,
  index: {
    status: "ready",
    skillCount: 2,
    chunkCount: 8,
    staleReason: null,
    error: null,
  },
  lastCliSmokeTest: null,
};

assert.deepEqual(
  buildChatStatusChips(readyStatus).map((chip) => chip.label),
  [
    "Ready to send",
    "Anthropic API",
    "Applied session",
    "Index ready",
    "API key ready",
  ],
);

assert.deepEqual(
  buildChatReadinessRows({
    status: readyStatus,
    release: { status: "ready", topAction: null },
  }).map((row) => [row.label, row.value, row.tone]),
  [
    ["Chat", "Ready to send", "ok"],
    ["Provider", "Anthropic API", "neutral"],
    ["Index", "Index ready", "ok"],
    ["API auth", "API key ready", "ok"],
  ],
);

const blockedCliStatus: ChatReadinessStatus = {
  ...readyStatus,
  provider: "claude_code_cli",
  runtimeSource: "process",
  canSend: false,
  blockingReason: "Local Claude CLI mode is disabled.",
  suggestedAction: "Enable local CLI mode.",
  index: { ...readyStatus.index, status: "stale", staleReason: "Index stale." },
  lastCliSmokeTest: {
    checked: true,
    ok: false,
    error: "Sanitized CLI failure.",
  },
};

assert.deepEqual(
  buildChatStatusChips(blockedCliStatus).map((chip) => [chip.label, chip.tone]),
  [
    ["Chat blocked", "error"],
    ["Claude CLI", "warn"],
    ["Process env", "neutral"],
    ["Index stale", "warn"],
    ["CLI test failed", "error"],
  ],
);

assert.equal(
  buildChatReadinessRows({
    status: blockedCliStatus,
    release: { status: "blocked", topAction: "Open Settings" },
  }).find((row) => row.label === "CLI test")?.detail,
  "Sanitized CLI failure.",
);

assert.equal(
  buildChatEmptyStateCopy({
    status: null,
    statusPending: true,
    statusError: null,
    indexNeedsAction: false,
  }).title,
  "Checking chat readiness",
);

assert.equal(
  buildChatEmptyStateCopy({
    status: blockedCliStatus,
    statusPending: false,
    statusError: null,
    indexNeedsAction: true,
  }).message,
  "Enable local CLI mode.",
);

assert.equal(
  indexSuggestedAction({
    status: "failed",
    skillCount: 0,
    chunkCount: 0,
    staleReason: null,
    error: "bad index",
  }),
  "Fix the index error, then rebuild.",
);

console.log("Chat readiness panel helper tests passed");
