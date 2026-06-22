import assert from "node:assert/strict";
import {
  getSettingsRawEnvPanelModel,
  SETTINGS_RAW_ENV_PLACEHOLDER,
} from "./settings-raw-env-panel";

const model = getSettingsRawEnvPanelModel();

assert.equal(model.textareaId, "settings-raw-env");
assert.equal(model.helpId, "settings-raw-env-help");
assert.equal(model.label, "Raw .env content");
assert.equal(model.placeholder, SETTINGS_RAW_ENV_PLACEHOLDER);
assert.ok(model.placeholder.includes("ANTHROPIC_API_KEY=<redacted-api-key>"));
assert.ok(model.placeholder.includes("CLAUDE_CLI_PATH=auto"));

console.log("Settings raw env panel helper tests passed");
