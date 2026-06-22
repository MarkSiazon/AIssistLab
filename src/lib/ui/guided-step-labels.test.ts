import assert from "node:assert/strict";

async function main() {
  const labels = await import("./guided-step-labels");

  assert.equal(
    labels.guidedStepButtonLabel({
      index: 0,
      label: "Purpose",
      total: 4,
      current: true,
    }),
    "Step 1 of 4: Purpose, current step.",
  );

  assert.equal(
    labels.guidedStepButtonLabel({
      index: 1,
      label: "Examples",
      total: 4,
      current: false,
    }),
    "Go to step 2 of 4: Examples.",
  );

  assert.doesNotMatch(
    labels.guidedStepButtonLabel({
      index: 2,
      label: "Boundaries",
      total: 4,
      current: false,
    }),
    /2Boundaries/,
  );

  assert.equal(
    labels.guidedStepIndexForKey({
      key: "ArrowRight",
      currentIndex: 0,
      total: 4,
    }),
    1,
  );
  assert.equal(
    labels.guidedStepIndexForKey({
      key: "ArrowRight",
      currentIndex: 3,
      total: 4,
    }),
    0,
  );
  assert.equal(
    labels.guidedStepIndexForKey({
      key: "ArrowLeft",
      currentIndex: 0,
      total: 4,
    }),
    3,
  );
  assert.equal(
    labels.guidedStepIndexForKey({
      key: "Home",
      currentIndex: 2,
      total: 4,
    }),
    0,
  );
  assert.equal(
    labels.guidedStepIndexForKey({
      key: "End",
      currentIndex: 1,
      total: 4,
    }),
    3,
  );
  assert.equal(
    labels.guidedStepIndexForKey({
      key: "Tab",
      currentIndex: 1,
      total: 4,
    }),
    null,
  );
  assert.equal(
    labels.guidedStepIndexForKey({
      key: "ArrowDown",
      currentIndex: 99,
      total: 4,
    }),
    0,
  );
  assert.equal(
    labels.guidedStepIndexForKey({
      key: "ArrowUp",
      currentIndex: -5,
      total: 4,
    }),
    3,
  );
  assert.equal(
    labels.guidedStepIndexForKey({
      key: "ArrowRight",
      currentIndex: 0,
      total: 0,
    }),
    null,
  );

  assert.equal(
    labels.guidedStepBackButtonLabel({
      currentIndex: 0,
      labels: ["Purpose", "Examples", "Boundaries", "Review"],
    }),
    "Already at the first step.",
  );
  assert.equal(
    labels.guidedStepBackButtonLabel({
      currentIndex: 2,
      labels: ["Purpose", "Examples", "Boundaries", "Review"],
    }),
    "Go back to step 2 of 4: Examples.",
  );
  assert.equal(
    labels.guidedStepNextButtonLabel({
      currentIndex: 0,
      labels: ["Purpose", "Examples", "Boundaries", "Review"],
    }),
    "Go forward to step 2 of 4: Examples.",
  );
  assert.equal(
    labels.guidedStepNextButtonLabel({
      currentIndex: 3,
      labels: ["Purpose", "Examples", "Boundaries", "Review"],
    }),
    "Already at the final step.",
  );

  console.log("Guided step label tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
