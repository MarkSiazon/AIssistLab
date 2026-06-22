import assert from "node:assert/strict";

async function main() {
  const keyboard = await import("./chat-composer-keyboard");

  assert.equal(
    keyboard.shouldSubmitChatComposer({
      key: "Enter",
      shiftKey: false,
      isComposing: false,
      inputValue: "How should this skill be tested?",
      disabled: false,
    }),
    true,
  );

  assert.equal(
    keyboard.shouldSubmitChatComposer({
      key: "Enter",
      shiftKey: true,
      isComposing: false,
      inputValue: "Line one",
      disabled: false,
    }),
    false,
  );

  assert.equal(
    keyboard.shouldSubmitChatComposer({
      key: "Enter",
      shiftKey: false,
      isComposing: true,
      inputValue: "入力中",
      disabled: false,
    }),
    false,
  );

  assert.equal(
    keyboard.shouldSubmitChatComposer({
      key: "Enter",
      shiftKey: false,
      isComposing: false,
      inputValue: "   ",
      disabled: false,
    }),
    false,
  );

  assert.equal(
    keyboard.shouldSubmitChatComposer({
      key: "Enter",
      shiftKey: false,
      isComposing: false,
      inputValue: "Ready text",
      disabled: true,
    }),
    false,
  );

  assert.equal(
    keyboard.shouldSubmitChatComposer({
      key: "a",
      shiftKey: false,
      isComposing: false,
      inputValue: "Ready text",
      disabled: false,
    }),
    false,
  );

  console.log("Chat composer keyboard tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
