import assert from "node:assert/strict";
import { buildExportEmptyActions } from "./export-empty-state";
import { isSafeInternalActionHref } from "./internal-action-href";

function ids(actions: ReturnType<typeof buildExportEmptyActions>) {
  return actions.map((action) => action.id);
}

function main() {
  assert.deepEqual(
    ids(
      buildExportEmptyActions({
        skillCount: 0,
        diagnosticsActionVisible: true,
      }),
    ),
    ["guided-builder", "skills-library"],
    "empty exports should not repeat diagnostics when a prominent diagnostics action is already visible",
  );

  assert.deepEqual(
    ids(
      buildExportEmptyActions({
        skillCount: 0,
        diagnosticsActionVisible: false,
      }),
    ),
    ["guided-builder", "skills-library", "export-diagnostics"],
    "empty exports should keep a diagnostics fallback when no prominent diagnostics action is visible",
  );

  const actions = buildExportEmptyActions({
    skillCount: 0,
    diagnosticsActionVisible: false,
  });
  for (const action of actions) {
    if (action.id === "export-diagnostics") {
      assert.equal("href" in action, false, "diagnostics action should render as a button");
    } else {
      assert.equal(
        isSafeInternalActionHref(action.href),
        true,
        "link actions should use safe internal app routes",
      );
    }
  }

  assert.deepEqual(
    buildExportEmptyActions({
      skillCount: 3,
      diagnosticsActionVisible: true,
    }),
    [],
    "skill-list exports should not use the empty-state action model",
  );

  console.log("Export empty state helper tests passed");
}

main();
