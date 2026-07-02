import assert from "node:assert/strict";
import {
  buildMockChatStatusPayload,
  buildMockChatStreamBody,
} from "./chat.mjs";

const textStream = buildMockChatStreamBody({
  preview: "Preview text.",
  textChunks: ["Hello ", "world."],
});
assert.match(textStream, /"type":"citations"/);
assert.match(textStream, /"preview":"Preview text\."/);
assert.match(textStream, /"type":"text","text":"Hello "/);
assert.match(textStream, /"type":"text","text":"world\."/);
assert.equal(textStream.endsWith("\n"), true);

const errorStream = buildMockChatStreamBody({
  preview: "Preview text.",
  textChunks: ["ignored"],
  errorMessage: "Provider failed.",
});
assert.match(errorStream, /"type":"error","message":"Provider failed\."/);
assert.doesNotMatch(errorStream, /ignored/);

const readyStatus = buildMockChatStatusPayload({
  suggestedQuestions: ["What should I test?"],
});
assert.equal(readyStatus.provider, "anthropic_api");
assert.equal(readyStatus.canSend, true);
assert.deepEqual(readyStatus.suggestedQuestions, ["What should I test?"]);
assert.deepEqual(readyStatus.index, {
  status: "ready",
  skillCount: 1,
  chunkCount: 2,
  staleReason: null,
  error: null,
});

const staleStatus = buildMockChatStatusPayload({
  suggestedAction: "Rebuild Index to refresh citations.",
  indexStatus: "stale",
  staleReason: "Smoke test changed the index state.",
});
assert.equal(staleStatus.suggestedAction, "Rebuild Index to refresh citations.");
assert.equal(staleStatus.index.status, "stale");
assert.equal(staleStatus.index.staleReason, "Smoke test changed the index state.");

console.log("Chat mock helper tests passed");
