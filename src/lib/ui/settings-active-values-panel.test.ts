import assert from "node:assert/strict";
import {
  buildSettingsActiveValueItems,
  type SettingsConfigField,
} from "./settings-active-values-panel";

const fields: SettingsConfigField[] = [
  {
    key: "WORKSPACE_ROOT",
    label: "Workspace Root Path",
    type: "path",
    placeholder: "",
    hint: "",
  },
  {
    key: "ANTHROPIC_API_KEY",
    label: "Anthropic API Key",
    type: "password",
    placeholder: "",
    hint: "",
  },
  {
    key: "NEXT_PUBLIC_APP_TITLE",
    label: "App Title",
    type: "text",
    placeholder: "",
    hint: "",
  },
];

const items = buildSettingsActiveValueItems({
  fields,
  values: {
    WORKSPACE_ROOT: "~/workspace",
    NEXT_PUBLIC_APP_TITLE: "Skill Workshop",
  },
  pathStates: {
    WORKSPACE_ROOT: "ok",
  },
  displayValueForField(field, value) {
    if (field.type === "password" && value) return "Configured (hidden)";
    return value;
  },
});

assert.deepEqual(items, [
  {
    key: "WORKSPACE_ROOT",
    label: "Workspace Root Path",
    statusLabel: "Valid",
    displayValue: "~/workspace",
    title: "~/workspace",
    tone: "ok",
  },
  {
    key: "ANTHROPIC_API_KEY",
    label: "Anthropic API Key",
    statusLabel: "Missing",
    displayValue: "(not set)",
    title: "(not set)",
    tone: "error",
  },
  {
    key: "NEXT_PUBLIC_APP_TITLE",
    label: "App Title",
    statusLabel: "Set",
    displayValue: "Skill Workshop",
    title: "Skill Workshop",
    tone: "neutral",
  },
]);

const checkingPath = buildSettingsActiveValueItems({
  fields: [fields[0]],
  values: {},
  pathStates: {
    WORKSPACE_ROOT: "checking",
  },
  displayValueForField: (_field, value) => value,
});

assert.equal(checkingPath[0].statusLabel, "Checking");
assert.equal(checkingPath[0].tone, "warn");
assert.equal(checkingPath[0].displayValue, "(not set)");

console.log("Settings active values panel helper tests passed");
