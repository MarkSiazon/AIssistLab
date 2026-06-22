import { getSkillTemplate } from "@/lib/skills/templates";
import { validateGuidedSkillDraftInput } from "@/lib/skills/guided-builder-validation";
import {
  buildGuidedSkillFeedback,
  buildSuggestedTestPrompts,
} from "@/lib/skills/guided-builder-feedback";
import type {
  GuidedSkillDraft,
  GuidedSkillDraftInput,
} from "@/lib/skills/guided-builder-types";
import type { SkillFrontmatter } from "@/types/skill";

function slugify(value: string): string {
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "for",
    "from",
    "into",
    "the",
    "these",
    "this",
    "to",
    "turn",
    "with",
  ]);
  const words = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !stopWords.has(word))
    .slice(0, 5);
  return (words.length > 0 ? words : ["guided", "skill"]).join("-").slice(0, 63);
}

function listBlock(items: string[], fallback: string): string {
  const source = items.length > 0 ? items : [fallback];
  return source.map((item) => `- ${item}`).join("\n");
}

function tagsFromTemplate(templateTags: unknown): string[] {
  return Array.isArray(templateTags)
    ? templateTags.filter((tag): tag is string => typeof tag === "string")
    : [];
}

export function buildGuidedSkillDraft(
  value: Partial<GuidedSkillDraftInput>,
): GuidedSkillDraft {
  const validation = validateGuidedSkillDraftInput(value);
  const input = validation.input;
  const template = getSkillTemplate(input.templateId) ?? getSkillTemplate("reference-skill");
  if (!template) throw new Error("No fallback skill template available.");

  const suggestedTestPrompts = buildSuggestedTestPrompts(input);
  const templateTags = tagsFromTemplate(template.initialFrontmatter.tags);
  const frontmatter: SkillFrontmatter = {
    ...template.initialFrontmatter,
    description: input.purpose,
    tags: Array.from(new Set([...templateTags, template.category, "guided"])),
    when_to_use:
      input.triggerExamples[0] ??
      `Use when the user needs help with ${input.purpose.toLowerCase()}.`,
  } as SkillFrontmatter;

  const body = `## Purpose

${input.purpose}

## Audience

${input.audience || "Describe who this skill is for before saving."}

## Coaching Flow

- Ask: What have you already tried before giving the final structure?
- Ask which constraint, input, or decision matters most.
- Offer one focused next step before expanding into a full answer.
- Use the rubric below to give specific feedback instead of generic approval.

## Trigger Examples

${listBlock(input.triggerExamples, "Add a realistic user prompt that should trigger this skill.")}

## Required Inputs

${listBlock(input.requiredInputs, "List the files, notes, data, or decisions the user should provide.")}

## Boundaries

${listBlock(input.boundaries, "State what the assistant must not assume, expose, or perform.")}

## Success Criteria

${listBlock(input.successCriteria, "Define what a good answer must include.")}

## Rubric Feedback

- Discoverability: The skill explains when it should activate.
- Specificity: The skill names concrete inputs and expected output.
- Examples: The skill includes prompts that can be tested in chat.
- Safety: The skill states boundaries and missing-evidence behavior.
- Maintainability: The skill can be reviewed without hidden context.

## Suggested Test Prompts

${listBlock(suggestedTestPrompts, "Add one prompt to test this skill after saving.")}

## Starter Structure From ${template.label}

${template.initialBody.trim()}
`;

  return {
    name: slugify(input.purpose),
    frontmatter,
    body,
    feedback: buildGuidedSkillFeedback(input),
  };
}
