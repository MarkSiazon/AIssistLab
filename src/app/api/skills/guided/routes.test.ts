import assert from "node:assert/strict";
import { jsonRequest, testRequest } from "@/lib/test-utils/request";

const input = {
  purpose:
    "Help support leads turn customer escalation notes into a calm response plan.",
  audience: "Support leads managing urgent customer escalations.",
  triggerExamples: [
    "Turn these escalation notes into a response plan.",
    "Help me review this customer escalation before I reply.",
  ],
  requiredInputs: ["customer concern", "current status", "owner"],
  boundaries: ["Do not promise timelines that are not in the notes."],
  successCriteria: [
    "The response plan separates known facts from open questions.",
    "The final checklist includes owner and next contact step.",
  ],
  templateId: "learning-rubric",
};

async function main() {
  const feedbackRoute = await import("./feedback/route");
  const draftRoute = await import("./draft/route");

  const blocked = await feedbackRoute.POST(
    jsonRequest("/api/skills/guided/feedback", input, { host: "example.com" }),
  );
  assert.equal(blocked.status, 403);

  const feedback = await feedbackRoute.POST(
    jsonRequest("/api/skills/guided/feedback", input),
  );
  const feedbackPayload = await feedback.json();
  assert.equal(feedback.status, 200);
  assert.equal(feedbackPayload.ok, true);
  assert.equal(feedbackPayload.feedback.score, 100);
  assert.equal(Array.isArray(feedbackPayload.feedback.suggestedTestPrompts), true);

  const invalid = await feedbackRoute.POST(
    jsonRequest("/api/skills/guided/feedback", {
      ...input,
      purpose: "",
    }),
  );
  const invalidPayload = await invalid.json();
  assert.equal(invalid.status, 400);
  assert.equal(invalidPayload.ok, false);
  assert.equal(Array.isArray(invalidPayload.validationErrors), true);

  const malformedFeedback = await feedbackRoute.POST(
    testRequest("/api/skills/guided/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    }),
  );
  const malformedFeedbackPayload = await malformedFeedback.json();
  assert.equal(malformedFeedback.status, 400);
  assert.equal(malformedFeedbackPayload.ok, false);
  assert.equal(Array.isArray(malformedFeedbackPayload.validationErrors), true);

  const draft = await draftRoute.POST(
    jsonRequest("/api/skills/guided/draft", input),
  );
  const draftPayload = await draft.json();
  assert.equal(draft.status, 200);
  assert.equal(draftPayload.ok, true);
  assert.match(draftPayload.draft.body, /## Coaching Flow/);
  assert.equal(JSON.stringify(draftPayload).includes("example.com"), false);

  const malformedDraft = await draftRoute.POST(
    testRequest("/api/skills/guided/draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    }),
  );
  const malformedDraftPayload = await malformedDraft.json();
  assert.equal(malformedDraft.status, 400);
  assert.equal(malformedDraftPayload.ok, false);
  assert.equal(Array.isArray(malformedDraftPayload.validationErrors), true);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
