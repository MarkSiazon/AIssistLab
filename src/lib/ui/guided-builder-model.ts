export type FeedbackStatus = "ok" | "warn" | "error";

export interface SkillTemplateSummary {
  id: string;
  label: string;
  description: string;
  category: string;
}

export interface FeedbackCategory {
  id: string;
  status: FeedbackStatus;
  message: string;
  suggestedFix: string;
}

export interface GuidedFeedback {
  score: number;
  categories: FeedbackCategory[];
  suggestedTestPrompts: string[];
}

export interface GuidedDraft {
  name: string;
  frontmatter: Record<string, unknown>;
  body: string;
  feedback: GuidedFeedback;
}

export interface GuidedValidationError {
  field: string;
  message: string;
}

export const GUIDED_FORM_STORAGE_KEY = "skill-workshop-guided-form";
export const GUIDED_STEPS = ["Purpose", "Examples", "Boundaries", "Review"];
export const GUIDED_STEP_GUIDANCE = [
  "Choose the skill shape, then name the work and audience clearly.",
  "Capture realistic trigger phrases and the inputs the skill needs.",
  "Define what the assistant must not assume, expose, or invent.",
  "Run deterministic feedback, build the draft, then review it in the editor.",
];

export function templateCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    reference: "Reference",
    workflow: "Workflow",
    command: "Command-style",
    subagent: "Subagent",
    learning: "Learning & Rubric",
  };
  return map[category] ?? "Template";
}

export function templateDefaultId(templates: SkillTemplateSummary[]): string {
  if (!templates.length) return "learning-rubric";
  const fallback = templates.find((template) => template.id === "learning-rubric");
  return fallback ? "learning-rubric" : templates[0].id;
}

export function splitGuidedLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function guidedFeedbackStatusColor(status: FeedbackStatus): string {
  if (status === "ok") return "var(--green)";
  if (status === "warn") return "var(--yellow)";
  return "var(--red)";
}

export function guidedFieldStyle() {
  return {
    background: "var(--surface-2)",
    borderColor: "var(--border)",
    color: "var(--text)",
    minHeight: "44px",
  };
}

export function formatGuidedAutosaveTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
