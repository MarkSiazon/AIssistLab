import assert from "node:assert/strict";
import {
  getEditorTabForKey,
  isEditorTabNavigationKey,
  type EditorTabId,
} from "./editor-tab-navigation";

function main() {
  assert.equal(isEditorTabNavigationKey("ArrowRight"), true);
  assert.equal(isEditorTabNavigationKey("ArrowLeft"), true);
  assert.equal(isEditorTabNavigationKey("Home"), true);
  assert.equal(isEditorTabNavigationKey("End"), true);
  assert.equal(isEditorTabNavigationKey("Enter"), false);

  assert.equal(
    getEditorTabForKey({ current: "edit", key: "ArrowRight" }),
    "preview",
  );
  assert.equal(
    getEditorTabForKey({ current: "preview", key: "ArrowRight" }),
    "edit",
  );
  assert.equal(
    getEditorTabForKey({ current: "edit", key: "ArrowLeft" }),
    "preview",
  );
  assert.equal(
    getEditorTabForKey({ current: "preview", key: "ArrowLeft" }),
    "edit",
  );
  assert.equal(getEditorTabForKey({ current: "preview", key: "Home" }), "edit");
  assert.equal(getEditorTabForKey({ current: "edit", key: "End" }), "preview");

  const unchanged: EditorTabId = getEditorTabForKey({
    current: "edit",
    key: "Enter",
  });
  assert.equal(unchanged, "edit");

  console.log("Editor tab navigation tests passed");
}

main();
