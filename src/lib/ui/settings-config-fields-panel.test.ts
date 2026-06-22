import assert from "node:assert/strict";
import {
  getSettingsConfigSectionRows,
  type SettingsConfigSection,
} from "./settings-config-fields-panel";

const sections: SettingsConfigSection[] = [
  {
    title: "Core Configuration",
    fields: [
      {
        key: "WORKSPACE_ROOT",
        label: "Workspace Root Path",
        type: "path",
        placeholder: "",
        hint: "Workspace path.",
      },
      {
        key: "ANTHROPIC_API_KEY",
        label: "Anthropic API Key",
        type: "password",
        placeholder: "",
        hint: "API key.",
      },
      {
        key: "CLAUDE_CONFIG_DIR",
        label: "Claude Profile",
        type: "profile",
        placeholder: "",
        hint: "Profile path.",
      },
    ],
  },
];

const rows = getSettingsConfigSectionRows({
  sections,
  pathStates: {
    WORKSPACE_ROOT: "ok",
    CLAUDE_CONFIG_DIR: "error",
  },
});

assert.equal(rows.length, 1);
assert.equal(rows[0].title, "Core Configuration");
assert.deepEqual(
  rows[0].fields.map((field) => ({
    key: field.field.key,
    fieldId: field.fieldId,
    hintId: field.hintId,
    labelHtmlFor: field.labelHtmlFor,
    pathState: field.pathState,
    showPathBadge: field.showPathBadge,
  })),
  [
    {
      key: "WORKSPACE_ROOT",
      fieldId: "settings-workspace-root",
      hintId: "settings-workspace-root-hint",
      labelHtmlFor: undefined,
      pathState: "ok",
      showPathBadge: true,
    },
    {
      key: "ANTHROPIC_API_KEY",
      fieldId: "settings-anthropic-api-key",
      hintId: "settings-anthropic-api-key-hint",
      labelHtmlFor: "settings-anthropic-api-key",
      pathState: "idle",
      showPathBadge: false,
    },
    {
      key: "CLAUDE_CONFIG_DIR",
      fieldId: "settings-claude-config-dir",
      hintId: "settings-claude-config-dir-hint",
      labelHtmlFor: "settings-claude-config-dir",
      pathState: "error",
      showPathBadge: true,
    },
  ],
);

console.log("Settings config fields panel helper tests passed");
