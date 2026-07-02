import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const editorBodyCss = readFileSync("src/app/styles/editor-body.css", "utf8");

const editPanelDisplayIndex = editorBodyCss.indexOf(".skill-editor-edit-panel {");
const hiddenPanelOverrideMatch = /\n\.skill-editor-edit-panel\[hidden\],\r?\n\.skill-editor-preview-scroll\[hidden\]/.exec(
  editorBodyCss,
);
const hiddenPanelOverrideIndex = hiddenPanelOverrideMatch?.index ?? -1;

assert.notEqual(
  editPanelDisplayIndex,
  -1,
  "editor body CSS should define the edit panel layout",
);
assert.notEqual(
  hiddenPanelOverrideIndex,
  -1,
  "editor body CSS should explicitly hide inactive tab panels",
);
assert.ok(
  hiddenPanelOverrideIndex > editPanelDisplayIndex,
  "hidden tab panel override should come after the edit panel display rule",
);
assert.match(
  editorBodyCss.slice(hiddenPanelOverrideIndex),
  /\.skill-editor-edit-panel\[hidden\],\r?\n\.skill-editor-preview-scroll\[hidden\]\s*\{\s*display:\s*none;\s*\}/,
  "hidden tab panel override should force display:none for edit and preview panels",
);

console.log("Skill editor tab CSS tests passed");
