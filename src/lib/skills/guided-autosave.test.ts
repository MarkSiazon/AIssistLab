import assert from "node:assert/strict";

async function main() {
  const autosave = await import("./guided-autosave");

  const snapshot = autosave.buildGuidedFormSnapshot(
    {
      step: 9,
      templateId: "learning-rubric",
      purpose: "  Help support leads turn notes into a response plan.  ",
      audience: "Support leads",
      triggerExamples: "Review these notes.",
      requiredInputs: "customer notes",
      boundaries: "Do not invent facts.",
      successCriteria: "The plan separates facts and next actions.",
    },
    new Date("2026-06-16T01:02:03.000Z"),
  );

  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.step, 3);
  assert.equal(snapshot.updatedAt, "2026-06-16T01:02:03.000Z");
  assert.equal(snapshot.purpose, "Help support leads turn notes into a response plan.");
  assert.equal(autosave.guidedFormHasContent(snapshot), true);

  const parsed = autosave.parseGuidedFormSnapshot(JSON.stringify(snapshot));
  assert.deepEqual(parsed, snapshot);

  const emptySnapshot = autosave.buildGuidedFormSnapshot({
    step: 0,
    templateId: "learning-rubric",
    purpose: "",
    audience: "",
    triggerExamples: "",
    requiredInputs: "",
    boundaries: "",
    successCriteria: "",
  });
  assert.equal(autosave.guidedFormHasContent(emptySnapshot), false);

  const longText = "x".repeat(autosave.GUIDED_FORM_AUTOSAVE_MAX_LENGTH + 50);
  const clipped = autosave.buildGuidedFormSnapshot({
    step: -5,
    templateId: "learning-rubric",
    purpose: longText,
    audience: "",
    triggerExamples: "",
    requiredInputs: "",
    boundaries: "",
    successCriteria: "",
  });
  assert.equal(clipped.step, 0);
  assert.equal(clipped.purpose.length, autosave.GUIDED_FORM_AUTOSAVE_MAX_LENGTH);

  assert.equal(autosave.parseGuidedFormSnapshot("{bad json"), null);
  assert.equal(
    autosave.parseGuidedFormSnapshot(JSON.stringify({ ...snapshot, schemaVersion: 99 })),
    null,
  );

  console.log("Guided autosave tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
