import { getSkillTemplate } from "@/lib/skills/templates";
import { normalizeGuidedSkillDraftInput } from "@/lib/skills/guided-builder-normalize";
import type {
  GuidedSkillDraftInput,
  GuidedSkillValidationError,
  NormalizedGuidedInput,
} from "@/lib/skills/guided-builder-types";

export function validateGuidedSkillDraftInput(
  value: Partial<GuidedSkillDraftInput>,
): {
  ok: boolean;
  errors: GuidedSkillValidationError[];
  input: NormalizedGuidedInput;
} {
  const input = normalizeGuidedSkillDraftInput(value);
  const errors: GuidedSkillValidationError[] = [];

  if (input.purpose.length < 12) {
    errors.push({
      field: "purpose",
      message: "Purpose needs a concrete task and outcome.",
    });
  }

  if (!input.audience) {
    errors.push({
      field: "audience",
      message: "Audience is required so the skill can tailor guidance.",
    });
  }

  if (input.triggerExamples.length === 0) {
    errors.push({
      field: "triggerExamples",
      message: "Add at least one example prompt that should trigger this skill.",
    });
  }

  if (input.successCriteria.length === 0) {
    errors.push({
      field: "successCriteria",
      message: "Add at least one success criterion for rubric feedback.",
    });
  }

  if (!getSkillTemplate(input.templateId)) {
    errors.push({
      field: "templateId",
      message: "Choose one of the available skill templates.",
    });
  }

  return { ok: errors.length === 0, errors, input };
}
