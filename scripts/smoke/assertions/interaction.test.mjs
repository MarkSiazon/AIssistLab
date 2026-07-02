import assert from "node:assert/strict";
import {
  assertRouteInteractionSnapshot,
  routeInteractionIssues,
} from "./interaction.mjs";

function snapshot(controls) {
  return { controls };
}

function control(overrides = {}) {
  return {
    accessibleName: "Save changes",
    descriptor: 'button "Save changes"',
    enforceTargetSize: true,
    height: 44,
    tag: "button",
    width: 120,
    ...overrides,
  };
}

assert.deepEqual(
  routeInteractionIssues(snapshot([control()]), "desktop /settings"),
  [],
);
assert.equal(
  assertRouteInteractionSnapshot(snapshot([control()]), "desktop /settings")
    .controls.length,
  1,
);

const issues = routeInteractionIssues(
  snapshot([
    control({ accessibleName: "" }),
    control({ descriptor: 'button "Tiny"', height: 32, width: 32 }),
    control({
      descriptor: 'input#workspace-root',
      height: 32,
      tag: "input",
      width: 200,
    }),
    control({
      descriptor: 'a "Inline link"',
      enforceTargetSize: false,
      height: 16,
      tag: "a",
      width: 20,
    }),
  ]),
  "mobile /settings",
);
assert.match(issues.join("\n"), /missing an accessible name/);
assert.match(issues.join("\n"), /small target height 32px/);
assert.match(issues.join("\n"), /small target width 32px/);
assert.doesNotMatch(issues.join("\n"), /Inline link/);

assert.throws(
  () =>
    assertRouteInteractionSnapshot(
      snapshot([control({ accessibleName: "" })]),
      "desktop /chat",
    ),
  /Route interaction issues/,
);

console.log("Interaction assertion helper tests passed");
