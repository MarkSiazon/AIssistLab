import assert from "node:assert/strict";
import {
  guidedFeedbackStatusColor,
  splitGuidedLines,
  templateCategoryLabel,
  templateDefaultId,
} from "./guided-builder-model";

assert.equal(templateCategoryLabel("learning"), "Learning & Rubric");
assert.equal(templateCategoryLabel("unknown"), "Template");

assert.equal(
  templateDefaultId([
    {
      id: "workflow",
      label: "Workflow",
      description: "Workflow template",
      category: "workflow",
    },
    {
      id: "learning-rubric",
      label: "Learning",
      description: "Learning template",
      category: "learning",
    },
  ]),
  "learning-rubric",
);

assert.equal(
  templateDefaultId([
    {
      id: "workflow",
      label: "Workflow",
      description: "Workflow template",
      category: "workflow",
    },
  ]),
  "workflow",
);

assert.deepEqual(splitGuidedLines(" one \n\n two "), ["one", "two"]);
assert.equal(guidedFeedbackStatusColor("ok"), "var(--green)");
assert.equal(guidedFeedbackStatusColor("warn"), "var(--yellow)");
assert.equal(guidedFeedbackStatusColor("error"), "var(--red)");

console.log("Guided builder model tests passed");
