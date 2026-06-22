import { getSkillTemplate } from "@/lib/skills/templates";
import { normalizeGuidedSkillDraftInput } from "@/lib/skills/guided-builder-normalize";
import type {
  GuidedSkillDraftInput,
  GuidedSkillFeedback,
  GuidedSkillFeedbackCategory,
  GuidedSkillFeedbackCategoryId,
  NormalizedGuidedInput,
} from "@/lib/skills/guided-builder-types";

const UNSAFE_PATTERN =
  /reveal secrets|ignore safety|bypass auth|steal|exfiltrate|rm\s+-rf|curl[\s\S]*\|\s*(bash|sh|pwsh|powershell)|invoke-expression|\biex\b/i;

function wordCount(value: string): number {
  return value.split(/\s+/).filter(Boolean).length;
}

function hasVagueText(value: string): boolean {
  return /\b(stuff|things|anything|whatever|general help|help with tasks)\b/i.test(
    value,
  );
}

function statusScore(status: GuidedSkillFeedbackCategory["status"]): number {
  if (status === "ok") return 20;
  if (status === "warn") return 10;
  return 0;
}

function category(
  id: GuidedSkillFeedbackCategoryId,
  status: GuidedSkillFeedbackCategory["status"],
  message: string,
  suggestedFix: string,
): GuidedSkillFeedbackCategory {
  return { id, status, message, suggestedFix };
}

export function buildSuggestedTestPrompts(
  input: NormalizedGuidedInput,
): string[] {
  const prompts = [...input.triggerExamples];
  if (input.successCriteria.length > 0) {
    prompts.push(`Check whether the skill output satisfies: ${input.successCriteria[0]}`);
  }
  return Array.from(new Set(prompts)).slice(0, 4);
}

export function buildGuidedSkillFeedback(
  value: Partial<GuidedSkillDraftInput>,
): GuidedSkillFeedback {
  const input = normalizeGuidedSkillDraftInput(value);
  const combinedText = [
    input.purpose,
    input.audience,
    ...input.triggerExamples,
    ...input.requiredInputs,
    ...input.boundaries,
    ...input.successCriteria,
  ].join("\n");

  const categories: GuidedSkillFeedbackCategory[] = [
    input.purpose.length >= 24 && input.triggerExamples.length >= 2
      ? category(
          "discoverability",
          "ok",
          "Purpose and trigger examples make the skill easy to recognize.",
          "Keep the first trigger example close to how a user would ask.",
        )
      : input.purpose.length < 12 || input.triggerExamples.length === 0
        ? category(
            "discoverability",
            "error",
            "The skill is missing a clear purpose or trigger example.",
            "Add the task outcome and one prompt that should invoke this skill.",
          )
        : category(
            "discoverability",
            "warn",
            "The skill can be found, but its trigger guidance is thin.",
            "Add a second realistic trigger example.",
          ),
    wordCount(input.purpose) >= 8 &&
    wordCount(input.audience) >= 6 &&
    input.requiredInputs.length >= 2 &&
    !hasVagueText(combinedText)
      ? category(
          "specificity",
          "ok",
          "The draft names a concrete user, task, and inputs.",
          "Keep nouns specific and avoid broad helper language.",
        )
      : wordCount(input.purpose) < 4 || hasVagueText(input.purpose)
        ? category(
            "specificity",
            "error",
            "The purpose is too vague for reliable skill invocation.",
            "Replace generic words with the exact workflow and output.",
          )
        : category(
            "specificity",
            "warn",
            "The draft needs clearer audience or input details.",
            "List the documents, data, or decisions the user should provide.",
          ),
    input.triggerExamples.length >= 2
      ? category(
          "examples",
          "ok",
          "The draft includes multiple realistic test prompts.",
          "Keep examples short enough to scan.",
        )
      : input.triggerExamples.length === 0
        ? category(
            "examples",
            "error",
            "No trigger examples are present.",
            "Add one exact user prompt that should activate this skill.",
          )
        : category(
            "examples",
            "warn",
            "Only one trigger example is present.",
            "Add another example from a different angle.",
          ),
    UNSAFE_PATTERN.test(combinedText)
      ? category(
          "safety",
          "error",
          "The draft includes unsafe or secret-seeking language.",
          "Rewrite boundaries so the skill refuses unsafe or unsupported requests.",
        )
      : input.boundaries.length > 0
        ? category(
            "safety",
            "ok",
            "The draft states boundaries for safer answers.",
            "Keep boundaries tied to realistic failure modes.",
          )
        : category(
            "safety",
            "warn",
            "The draft does not state boundaries.",
            "Add what the assistant should not assume, expose, or perform.",
          ),
    input.successCriteria.length >= 2 && Boolean(getSkillTemplate(input.templateId))
      ? category(
          "maintainability",
          "ok",
          "The draft has enough rubric criteria to review future edits.",
          "Keep criteria observable so reviewers can check them.",
        )
      : category(
          "maintainability",
          getSkillTemplate(input.templateId) ? "warn" : "error",
          "The draft needs stronger review criteria or a valid template.",
          "Choose a template and add at least two success criteria.",
        ),
  ];

  return {
    score: categories.reduce((total, item) => total + statusScore(item.status), 0),
    categories,
    suggestedTestPrompts: buildSuggestedTestPrompts(input),
  };
}
