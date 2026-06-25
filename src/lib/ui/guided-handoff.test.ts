import assert from "node:assert/strict";

async function main() {
  const handoff = await import("./guided-handoff");

  const baseFeedback = {
    score: 80,
    categories: [
      {
        id: "discoverability",
        status: "ok" as const,
        message: "Purpose and examples are clear.",
        suggestedFix: "Keep examples realistic.",
      },
    ],
  };

  assert.deepEqual(
    handoff.buildGuidedHandoffState({
      requiredReady: false,
      loading: false,
      feedback: null,
      draftReady: false,
    }),
    {
      status: "blocked",
      statusLabel: "Needs required details",
      message:
        "Complete the required readiness items before review, build, or editor handoff.",
      reviewDisabled: true,
      buildDisabled: true,
      openDisabled: true,
      primaryAction: "review",
    },
  );

  assert.deepEqual(
    handoff.buildGuidedHandoffState({
      requiredReady: true,
      loading: false,
      feedback: null,
      draftReady: false,
    }),
    {
      status: "needs_review",
      statusLabel: "Review needed",
      message: "Run rubric feedback before building the draft.",
      reviewDisabled: false,
      buildDisabled: true,
      openDisabled: true,
      primaryAction: "review",
    },
  );

  assert.deepEqual(
    handoff.buildGuidedHandoffState({
      requiredReady: true,
      loading: false,
      feedback: {
        ...baseFeedback,
        score: 60,
        categories: [
          {
            id: "safety",
            status: "error" as const,
            message: "Unsafe language is present.",
            suggestedFix: "Rewrite boundaries.",
          },
        ],
      },
      draftReady: false,
    }),
    {
      status: "blocked",
      statusLabel: "Fix rubric errors",
      message:
        "Fix rubric errors before building or opening the draft in the editor.",
      reviewDisabled: false,
      buildDisabled: true,
      openDisabled: true,
      primaryAction: "review",
    },
  );

  assert.deepEqual(
    handoff.buildGuidedHandoffState({
      requiredReady: true,
      loading: false,
      feedback: baseFeedback,
      draftReady: false,
    }),
    {
      status: "needs_build",
      statusLabel: "Build preview",
      message: "Rubric has no errors. Build the draft so you can preview it before editing.",
      reviewDisabled: false,
      buildDisabled: false,
      openDisabled: true,
      primaryAction: "build",
    },
  );

  assert.deepEqual(
    handoff.buildGuidedHandoffState({
      requiredReady: true,
      loading: false,
      feedback: {
        ...baseFeedback,
        score: 70,
        categories: [
          {
            id: "examples",
            status: "warn" as const,
            message: "Only one trigger example is present.",
            suggestedFix: "Add another trigger example.",
          },
        ],
      },
      draftReady: true,
    }),
    {
      status: "ready",
      statusLabel: "Ready with warnings",
      message:
        "Draft preview is ready. You can improve warnings now or continue in the editor.",
      reviewDisabled: false,
      buildDisabled: false,
      openDisabled: false,
      primaryAction: "open",
    },
  );

  assert.deepEqual(
    handoff.buildGuidedHandoffState({
      requiredReady: true,
      loading: false,
      feedback: { ...baseFeedback, score: 100 },
      draftReady: true,
    }),
    {
      status: "ready",
      statusLabel: "Ready for editor",
      message: "Draft preview is ready for final validation and save in the editor.",
      reviewDisabled: false,
      buildDisabled: false,
      openDisabled: false,
      primaryAction: "open",
    },
  );

  assert.equal(
    handoff.buildGuidedHandoffState({
      requiredReady: true,
      loading: true,
      feedback: baseFeedback,
      draftReady: true,
    }).openDisabled,
    true,
  );

  const buildPrimary = handoff.buildGuidedHandoffState({
    requiredReady: true,
    loading: false,
    feedback: baseFeedback,
    draftReady: false,
  });
  assert.equal(
    handoff.guidedHandoffActionClass("build", buildPrimary),
    "ui-button ui-button-primary",
  );
  assert.equal(
    handoff.guidedHandoffActionClass("review", buildPrimary),
    "ui-button ui-button-secondary",
  );

  console.log("Guided handoff helper tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
