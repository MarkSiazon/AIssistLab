import assert from "node:assert/strict";
import {
  assertRouteSemanticSnapshot,
  routeSemanticIssues,
} from "./semantic-assertions.mjs";

function validSnapshot(overrides = {}) {
  return {
    mainLandmarkCount: 1,
    visibleH1Texts: ["Library Readiness"],
    visibleHeadingLevels: [1, 2, 2, 3],
    duplicateIds: [],
    brokenAriaReferences: [],
    focusableNameIssues: [],
    hiddenFocusableIssues: [],
    linkTargetIssues: [],
    ...overrides,
  };
}

assert.deepEqual(routeSemanticIssues(validSnapshot(), "desktop /skills"), []);
assert.equal(
  assertRouteSemanticSnapshot(validSnapshot(), "desktop /skills").mainLandmarkCount,
  1,
);

const structureIssues = routeSemanticIssues(
  validSnapshot({
    mainLandmarkCount: 0,
    visibleH1Texts: ["One", "Two"],
    visibleHeadingLevels: [2, 4],
  }),
  "mobile /settings",
);
assert.match(structureIssues.join("\n"), /exactly one visible main landmark/);
assert.match(structureIssues.join("\n"), /exactly one visible h1/);
assert.match(structureIssues.join("\n"), /first visible heading should be h1/);
assert.match(structureIssues.join("\n"), /skips heading level from h2 to h4/);

const referenceIssues = routeSemanticIssues(
  validSnapshot({
    duplicateIds: ["main-content"],
    brokenAriaReferences: [
      {
        attribute: "aria-describedby",
        targetId: "missing-help",
        descriptor: "input#name",
      },
    ],
    focusableNameIssues: ["button.icon-only"],
    hiddenFocusableIssues: ["a.hidden-link"],
    linkTargetIssues: ["a points to missing #missing-section"],
  }),
  "desktop /editor",
);
assert.match(referenceIssues.join("\n"), /duplicate id #main-content/);
assert.match(referenceIssues.join("\n"), /aria-describedby references missing #missing-help/);
assert.match(referenceIssues.join("\n"), /focusable control is missing a name/);
assert.match(referenceIssues.join("\n"), /aria-hidden element remains focusable/);
assert.match(referenceIssues.join("\n"), /link target issue/);

assert.throws(
  () =>
    assertRouteSemanticSnapshot(
      validSnapshot({ focusableNameIssues: ["button.icon-only"] }),
      "desktop /chat",
    ),
  /Route semantic issues/,
);

console.log("Semantic assertion helper tests passed");
