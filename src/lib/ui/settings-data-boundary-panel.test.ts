import assert from "node:assert/strict";
import {
  getSettingsDataBoundaryPanelModel,
  settingsDataBoundaryItems,
  settingsDataBoundaryToneClassName,
} from "./settings-data-boundary-panel";

const model = getSettingsDataBoundaryPanelModel();
const combinedCopy = [
  model.title,
  model.subtitle,
  model.footer,
  ...model.items.flatMap((item) => [item.label, item.summary, item.detail]),
].join("\n");

assert.deepEqual(
  settingsDataBoundaryItems.map((item) => item.id),
  ["workspace-files", "rag-chat", "diagnostics", "manual-checks"],
  "data boundary panel should cover local files, chat context, diagnostics, and manual gates",
);

assert.match(
  settingsDataBoundaryItems.find((item) => item.id === "rag-chat")?.summary ??
    "",
  /only when you send a chat message/i,
  "chat copy should make explicit user action the send boundary",
);

assert.match(
  settingsDataBoundaryItems.find((item) => item.id === "diagnostics")?.detail ??
    "",
  /omit API keys, account identifiers, OAuth paths/i,
  "diagnostics copy should name the sensitive data classes that stay scrubbed",
);

assert.match(
  model.footer,
  /only after the local device or account check was actually performed/i,
  "manual QA copy should not imply manual checks can be automated or pre-marked",
);

assert.equal(
  settingsDataBoundaryToneClassName("sanitized"),
  "settings-data-boundary-tone-sanitized",
  "tone helper should keep CSS classes deterministic",
);

assert.doesNotMatch(
  combinedCopy,
  /never sends data|fully certified|automatically passed|C:\\Users\\|Bearer\s+[a-z0-9._-]+|sk-ant-/i,
  "data boundary copy should avoid overclaims, private paths, and token-shaped examples",
);

console.log("Settings data boundary panel tests passed");
