export interface ChatComposerActionInput {
  inputValue: string;
  streaming: boolean;
  statusPending: boolean;
  statusError: boolean;
  sendBlocked: boolean;
  indexNeedsAction: boolean;
}

export interface ChatComposerActionState {
  disabled: boolean;
  buttonLabel: string;
  ariaLabel: string;
  disabledReason: string | null;
}

export function buildChatComposerActionState(
  input: ChatComposerActionInput,
): ChatComposerActionState {
  if (input.streaming) {
    return {
      disabled: true,
      buttonLabel: "Sending...",
      ariaLabel: "Sending message",
      disabledReason: "Sending message.",
    };
  }

  if (input.statusPending) {
    return {
      disabled: true,
      buttonLabel: "Checking...",
      ariaLabel: "Checking chat readiness",
      disabledReason: "Checking local provider, auth, and index readiness.",
    };
  }

  if (input.statusError) {
    return {
      disabled: true,
      buttonLabel: "Unavailable",
      ariaLabel: "Chat readiness unavailable",
      disabledReason:
        "Chat readiness is unavailable. Open Settings or export diagnostics.",
    };
  }

  if (input.sendBlocked) {
    return {
      disabled: true,
      buttonLabel: "Setup required",
      ariaLabel: "Resolve setup before sending",
      disabledReason: "Chat is blocked until provider settings are ready.",
    };
  }

  if (!input.inputValue.trim()) {
    return {
      disabled: true,
      buttonLabel: "Type message",
      ariaLabel: "Type a message before sending",
      disabledReason: "Type a message before sending.",
    };
  }

  if (input.indexNeedsAction) {
    return {
      disabled: false,
      buttonLabel: "Send anyway",
      ariaLabel: "Send message despite index warning",
      disabledReason: null,
    };
  }

  return {
    disabled: false,
    buttonLabel: "Send",
    ariaLabel: "Send message",
    disabledReason: null,
  };
}
