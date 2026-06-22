import assert from "node:assert/strict";

import { buildChatComposerActionState } from "./chat-composer-action";

function action(overrides = {}) {
  return buildChatComposerActionState({
    inputValue: "How do I use release skills?",
    streaming: false,
    statusPending: false,
    statusError: false,
    sendBlocked: false,
    indexNeedsAction: false,
    ...overrides,
  });
}

assert.deepEqual(action({ streaming: true }), {
  disabled: true,
  buttonLabel: "Sending...",
  ariaLabel: "Sending message",
  disabledReason: "Sending message.",
});

assert.deepEqual(action({ statusPending: true }), {
  disabled: true,
  buttonLabel: "Checking...",
  ariaLabel: "Checking chat readiness",
  disabledReason: "Checking local provider, auth, and index readiness.",
});

assert.deepEqual(action({ statusError: true }), {
  disabled: true,
  buttonLabel: "Unavailable",
  ariaLabel: "Chat readiness unavailable",
  disabledReason: "Chat readiness is unavailable. Open Settings or export diagnostics.",
});

assert.deepEqual(action({ sendBlocked: true }), {
  disabled: true,
  buttonLabel: "Setup required",
  ariaLabel: "Resolve setup before sending",
  disabledReason: "Chat is blocked until provider settings are ready.",
});

assert.deepEqual(action({ inputValue: "   " }), {
  disabled: true,
  buttonLabel: "Type message",
  ariaLabel: "Type a message before sending",
  disabledReason: "Type a message before sending.",
});

assert.deepEqual(action({ indexNeedsAction: true }), {
  disabled: false,
  buttonLabel: "Send anyway",
  ariaLabel: "Send message despite index warning",
  disabledReason: null,
});

assert.deepEqual(action(), {
  disabled: false,
  buttonLabel: "Send",
  ariaLabel: "Send message",
  disabledReason: null,
});

console.log("Chat composer action tests passed");
