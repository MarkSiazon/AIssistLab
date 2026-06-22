import assert from "node:assert/strict";
import {
  buildGuidedChecklist,
  guidedChecklistStatusColor,
} from "./guided-checklist";

assert.equal(guidedChecklistStatusColor("ready"), "var(--green)");
assert.equal(guidedChecklistStatusColor("needs_action"), "var(--yellow)");
assert.equal(guidedChecklistStatusColor("optional"), "var(--text-muted)");

const emptyState = buildGuidedChecklist({
  selectedTemplateLabel: null,
  purpose: "",
  audience: "",
  triggerExampleCount: 0,
  requiredInputCount: 0,
  boundaryCount: 0,
  successCriteriaCount: 0,
  feedbackScore: null,
});

assert.equal(emptyState.requiredReady, false);
assert.equal(emptyState.completedRequiredCount, 0);
assert.equal(emptyState.requiredItems.length, 5);
assert.equal(emptyState.readinessSummary, "5 required items left before review");
assert.equal(emptyState.items.find((item) => item.id === "inputs")?.status, "optional");

const readyState = buildGuidedChecklist({
  selectedTemplateLabel: "Learning & Rubric Skill",
  purpose: "Help reviewers build better rubric-based skills.",
  audience: "Skill authors",
  triggerExampleCount: 2,
  requiredInputCount: 1,
  boundaryCount: 1,
  successCriteriaCount: 3,
  feedbackScore: 86,
});

assert.equal(readyState.requiredReady, true);
assert.equal(readyState.completedRequiredCount, 5);
assert.equal(readyState.readinessSummary, "Ready for rubric review");
assert.equal(
  readyState.items.find((item) => item.id === "feedback")?.message,
  "Latest score is 86/100.",
);
assert.equal(
  readyState.items.find((item) => item.id === "triggers")?.message,
  "2 example prompts captured.",
);

console.log("Guided checklist helper tests passed");
