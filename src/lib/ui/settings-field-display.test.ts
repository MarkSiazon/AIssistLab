import assert from "node:assert/strict";
import { getSettingsFieldDisplayValue } from "./settings-field-display";
import type { SettingsConfigField } from "./settings-active-values-panel";

const textField: SettingsConfigField = {
  key: "NEXT_PUBLIC_APP_TITLE",
  label: "App Title",
  type: "text",
  placeholder: "",
  hint: "",
};

function field(
  key: string,
  type: SettingsConfigField["type"],
): SettingsConfigField {
  return {
    key,
    label: key,
    type,
    placeholder: "",
    hint: "",
  };
}

function main() {
  const fields = {
    CLAUDE_CONFIG_DIR: "~/.config/profiles/saved",
  };
  const profileSelection = {
    profileId: "default",
    manualConfigDir: "",
  };
  const formatPath = (value: string | undefined) =>
    value ? `display:${value}` : "display-empty";

  assert.equal(
    getSettingsFieldDisplayValue({
      field: textField,
      value: "Skill Workshop RAG",
      profileSelection,
      fields,
      formatPath,
    }),
    "Skill Workshop RAG",
    "ordinary text fields should return the current value",
  );

  assert.equal(
    getSettingsFieldDisplayValue({
      field: field("ANTHROPIC_API_KEY", "password"),
      value: "configured-secret",
      profileSelection,
      fields,
      formatPath,
    }),
    "Configured (hidden)",
    "configured password fields should be masked",
  );

  assert.equal(
    getSettingsFieldDisplayValue({
      field: field("ANTHROPIC_API_KEY", "password"),
      value: "",
      profileSelection,
      fields,
      formatPath,
    }),
    "",
    "empty password fields should remain empty so missing state can show",
  );

  assert.equal(
    getSettingsFieldDisplayValue({
      field: field("WORKSPACE_ROOT", "path"),
      value: "C:/workspace",
      profileSelection,
      fields,
      formatPath,
    }),
    "display:C:/workspace",
    "path fields should use the supplied path formatter",
  );

  assert.equal(
    getSettingsFieldDisplayValue({
      field: field("CLAUDE_CLI_PATH", "text"),
      value: "auto",
      profileSelection,
      fields,
      formatPath,
    }),
    "display:auto",
    "CLI command fields should use path-style formatting even though they are text inputs",
  );

  assert.equal(
    getSettingsFieldDisplayValue({
      field: field("CLAUDE_CONFIG_DIR", "profile"),
      value: "~/.config/profiles/saved",
      profileSelection: {
        profileId: "manual",
        manualConfigDir: "~/.config/profiles/manual",
      },
      fields,
      formatPath,
    }),
    "display:~/.config/profiles/manual",
    "manual Claude profile display should prefer the active manual path",
  );

  assert.equal(
    getSettingsFieldDisplayValue({
      field: field("CLAUDE_CONFIG_DIR", "profile"),
      value: "",
      profileSelection: { profileId: "profile-2", manualConfigDir: "" },
      fields,
      claudeStatus: {
        profiles: [
          { id: "profile-1", displayPath: "Profile 1 path" },
          { id: "profile-2", displayPath: "Profile 2 path" },
        ],
        selectedProfile: { displayPath: "Default profile path" },
      },
      formatPath,
    }),
    "Profile 2 path",
    "selected discovered Claude profile display should use its public display path",
  );

  assert.equal(
    getSettingsFieldDisplayValue({
      field: field("CLAUDE_CONFIG_DIR", "profile"),
      value: "",
      profileSelection: { profileId: "missing", manualConfigDir: "" },
      fields,
      claudeStatus: {
        profiles: [],
        selectedProfile: { displayPath: "Default profile path" },
      },
      formatPath,
    }),
    "Default profile path",
    "missing selected profile ids should fall back to the selected profile display path",
  );

  console.log("Settings field display helper tests passed");
}

main();
