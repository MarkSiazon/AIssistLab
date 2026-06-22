import assert from "node:assert/strict";
import {
  getPasswordFieldState,
  getRelativePathFieldState,
  getSelectFieldValue,
  toRelativeSettingsPath,
} from "./settings-field-controls";

assert.equal(
  toRelativeSettingsPath("C:\\workspace\\.claude\\skills", "C:\\workspace"),
  ".claude/skills",
);
assert.equal(toRelativeSettingsPath("C:\\workspace", "C:\\workspace"), ".");
assert.equal(
  toRelativeSettingsPath("C:\\workspace2\\.claude\\skills", "C:\\workspace"),
  "C:\\workspace2\\.claude\\skills",
);
assert.equal(
  toRelativeSettingsPath("D:\\other\\.claude\\skills", "C:\\workspace"),
  "D:\\other\\.claude\\skills",
);

assert.deepEqual(
  getRelativePathFieldState({
    value: ".claude/skills",
    workspaceRoot: "C:\\workspace\\",
  }),
  {
    browseFrom: "C:\\workspace\\.claude\\skills",
    resolvedPath: "C:\\workspace\\.claude\\skills",
  },
);
assert.deepEqual(
  getRelativePathFieldState({
    value: ".",
    workspaceRoot: "C:\\workspace\\",
  }),
  {
    browseFrom: "C:\\workspace",
    resolvedPath: "C:\\workspace",
  },
);
assert.deepEqual(
  getRelativePathFieldState({
    value: "./.claude/skills",
    workspaceRoot: "C:\\workspace",
  }),
  {
    browseFrom: "C:\\workspace\\.claude\\skills",
    resolvedPath: "C:\\workspace\\.claude\\skills",
  },
);
assert.deepEqual(
  getRelativePathFieldState({
    value: "D:\\other\\.claude\\skills",
    workspaceRoot: "C:\\workspace",
  }),
  {
    browseFrom: "D:\\other\\.claude\\skills",
    resolvedPath: "D:\\other\\.claude\\skills",
  },
);

assert.equal(
  getSelectFieldValue({
    value: "",
    defaultValue: "anthropic_api",
    placeholder: "provider",
  }),
  "anthropic_api",
);
assert.equal(
  getSelectFieldValue({
    value: "claude_code_cli",
    defaultValue: "anthropic_api",
    placeholder: "provider",
  }),
  "claude_code_cli",
);

assert.deepEqual(
  getPasswordFieldState({
    visible: false,
    label: "Anthropic API Key",
  }),
  {
    inputType: "password",
    toggleLabel: "Show",
    toggleAriaLabel: "Show Anthropic API Key",
  },
);
assert.deepEqual(
  getPasswordFieldState({
    visible: true,
    label: "Anthropic API Key",
  }),
  {
    inputType: "text",
    toggleLabel: "Hide",
    toggleAriaLabel: "Hide Anthropic API Key",
  },
);

console.log("Settings field controls helper tests passed");
