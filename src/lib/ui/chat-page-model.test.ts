import assert from "node:assert/strict";
import { buildChatPageModel, type ChatPageStatus } from "./chat-page-model";

const readyStatus: ChatPageStatus = {
  provider: "anthropic_api",
  runtimeSource: "runtime",
  canSend: true,
  blockingReason: null,
  suggestedAction: null,
  claudeCliEnabled: false,
  suggestedQuestions: ["Which skill should I use?"],
  index: {
    status: "ready",
    skillCount: 2,
    chunkCount: 5,
    staleReason: null,
    error: null,
  },
  lastCliSmokeTest: null,
};

const blockedStatus: ChatPageStatus = {
  ...readyStatus,
  canSend: false,
  blockingReason: "Missing API key.",
  suggestedAction: "Add an API key in Settings.",
  index: {
    ...readyStatus.index,
    status: "missing",
    skillCount: 0,
    chunkCount: 0,
  },
};

const staleIndexStatus: ChatPageStatus = {
  ...readyStatus,
  index: {
    ...readyStatus.index,
    status: "stale",
    staleReason: "Skills changed after the last rebuild.",
  },
};

const pending = buildChatPageModel({
  status: null,
  statusError: null,
  releaseSummary: null,
  inputValue: "",
  streaming: false,
});
assert.equal(pending.chatStatusPending, true);
assert.equal(pending.sendDisabled, true);
assert.equal(pending.inputLocked, true);
assert.equal(pending.composerAction.buttonLabel, "Checking...");
assert.equal(pending.emptyStateCopy.title, "Checking chat readiness");

const blocked = buildChatPageModel({
  status: blockedStatus,
  statusError: null,
  releaseSummary: { status: "blocked", topAction: "Add an API key." },
  inputValue: "hello",
  streaming: false,
});
assert.equal(blocked.sendBlocked, true);
assert.equal(blocked.inputLocked, true);
assert.equal(blocked.composerStatusTone, "error");
assert.equal(blocked.composerStatusDetail, "Missing API key.");
assert.equal(blocked.emptyActions[0]?.id, "settings");

const stale = buildChatPageModel({
  status: staleIndexStatus,
  statusError: null,
  releaseSummary: { status: "needs_action", topAction: null },
  inputValue: "hello",
  streaming: false,
});
assert.equal(stale.sendDisabled, false);
assert.equal(stale.composerAction.buttonLabel, "Send anyway");
assert.equal(stale.actionVisibility.showIndexAlert, true);
assert.equal(stale.composerStatusDetail, "Skills changed after the last rebuild.");
assert.deepEqual(stale.emptySuggestions, ["Which skill should I use?"]);

const ready = buildChatPageModel({
  status: readyStatus,
  statusError: null,
  releaseSummary: { status: "ready", topAction: null },
  inputValue: "hello",
  streaming: false,
});
assert.equal(ready.sendDisabled, false);
assert.equal(ready.inputLocked, false);
assert.equal(ready.composerAction.buttonLabel, "Send");
assert.deepEqual(ready.emptySuggestions, ["Which skill should I use?"]);

console.log("Chat page model tests passed");
