# Iteration 04: Guided Learning

## Goal

Add an education-style Guided Skill Builder that helps users write better skills by asking useful questions, showing templates, and providing rubric feedback.

## Success Criteria

- Users can create a skill through a guided flow without needing to know the full skill spec upfront.
- The flow coaches the user through purpose, triggers, inputs, examples, and safety boundaries.
- Draft output remains editable and validated before save.
- Rubric feedback is deterministic in V1.

## In Scope

- Guided builder page or mode.
- Deterministic prompts and rubric.
- Template selection and preview.
- Draft-to-editor handoff.
- Suggested test prompts.

## Out Of Scope

- Hidden LLM generation on page load.
- Automatic install without review.
- Hosted classroom/user accounts.
- Analytics beyond local session state.

## Public Interfaces

Add local-only APIs only if server-side rubric/template logic is needed:

```ts
interface GuidedSkillDraftInput {
  purpose: string;
  audience: string;
  triggerExamples: string[];
  requiredInputs: string[];
  boundaries: string[];
  successCriteria: string[];
  templateId: string;
}

interface GuidedSkillFeedback {
  score: number;
  categories: Array<{
    id: "discoverability" | "specificity" | "examples" | "safety" | "maintainability";
    status: "ok" | "warn" | "error";
    message: string;
    suggestedFix: string;
  }>;
  suggestedTestPrompts: string[];
}
```

Candidate endpoints:

- `POST /api/skills/guided/feedback`
- `POST /api/skills/guided/draft`

These endpoints must be deterministic for V1.

## Likely Modules

- New `src/lib/skills/guided-builder.ts`
- New or extended editor page under `src/app/editor`
- `src/components/editor/SkillEditorForm.tsx`
- `src/lib/skills/templates.ts`
- `src/lib/skills/quality.ts`

## Checklist

- [x] Add tests for guided input validation.
- [x] Add deterministic rubric tests for complete, weak, unsafe, and vague skill drafts.
- [x] Build guided input model with fields for purpose, audience, triggers, inputs, boundaries, success criteria, and template.
- [x] Add builder UI with one visible step at a time and a summary sidebar.
- [x] Add coaching prompts inspired by Learning Mode: ask the user how they would approach the task before generating structure.
- [x] Add draft generation from selected template and guided answers.
- [x] Add rubric feedback panel with category status and suggested fixes.
- [x] Add suggested test prompts generated from trigger examples and success criteria.
- [x] Add handoff to normal editor with draft content loaded.
- [x] Keep save behavior unchanged: validation must pass and user must click save.

## Tests

- New:
  - `npx --yes tsx src/lib/skills/guided-builder.test.ts`
- Existing:
  - `npx --yes tsx src/lib/skills/templates.test.ts`
  - `npx --yes tsx src/lib/skills/quality.test.ts`
  - `npx --yes tsx src/lib/skills/validation.test.ts`
- Final gates:
  - `npm run lint`
  - `npm run build`

## Browser Smoke

- Open guided builder.
- Complete the flow with a reference skill.
- Confirm rubric feedback renders.
- Confirm suggested test prompts render.
- Send draft to editor.
- Save valid draft and confirm index is marked stale.
- Try vague input and confirm feedback asks for more specificity.

## Privacy Acceptance

- Guided builder does not call an LLM in V1.
- Guided builder stores no account data.
- Draft content is not sent outside local APIs.
- Feedback output contains only user-provided draft content and deterministic suggestions.

## Checkpoint Recommendation

Checkpoint as `feat(skills): add guided skill builder` only after tests, build, and browser smoke pass.

## Implementation Evidence

- Added deterministic guided skill builder logic with validation, rubric feedback, test prompts, and draft generation.
- Added local-only guided feedback and draft APIs.
- Added `/editor/guided` with one visible step at a time, summary sidebar, rubric panel, draft preview, and editor handoff.
- Updated the existing editor to load guided drafts from local session storage and keep normal validation/save behavior.
- Live browser smoke used a temporary workspace and confirmed guided review, draft preview, editor handoff, save, and stale-index state.
