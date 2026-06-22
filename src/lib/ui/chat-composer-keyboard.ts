export interface ChatComposerKeyboardInput {
  key: string;
  shiftKey: boolean;
  isComposing: boolean;
  inputValue: string;
  disabled: boolean;
}

export function shouldSubmitChatComposer({
  key,
  shiftKey,
  isComposing,
  inputValue,
  disabled,
}: ChatComposerKeyboardInput): boolean {
  if (key !== "Enter") return false;
  if (shiftKey) return false;
  if (isComposing) return false;
  if (disabled) return false;
  return inputValue.trim().length > 0;
}
