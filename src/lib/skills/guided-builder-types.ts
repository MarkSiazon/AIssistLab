import type { SkillFrontmatter } from "@/types/skill";

export type GuidedSkillFeedbackCategoryId =
  | "discoverability"
  | "specificity"
  | "examples"
  | "safety"
  | "maintainability";

export interface GuidedSkillDraftInput {
  purpose: string;
  audience: string;
  triggerExamples: string[];
  requiredInputs: string[];
  boundaries: string[];
  successCriteria: string[];
  templateId: string;
}

export interface GuidedSkillValidationError {
  field:
    | "purpose"
    | "audience"
    | "triggerExamples"
    | "requiredInputs"
    | "boundaries"
    | "successCriteria"
    | "templateId";
  message: string;
}

export interface GuidedSkillFeedbackCategory {
  id: GuidedSkillFeedbackCategoryId;
  status: "ok" | "warn" | "error";
  message: string;
  suggestedFix: string;
}

export interface GuidedSkillFeedback {
  score: number;
  categories: GuidedSkillFeedbackCategory[];
  suggestedTestPrompts: string[];
}

export interface GuidedSkillDraft {
  name: string;
  frontmatter: SkillFrontmatter;
  body: string;
  feedback: GuidedSkillFeedback;
}

export interface NormalizedGuidedInput {
  purpose: string;
  audience: string;
  triggerExamples: string[];
  requiredInputs: string[];
  boundaries: string[];
  successCriteria: string[];
  templateId: string;
}
