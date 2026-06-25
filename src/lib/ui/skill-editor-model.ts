import { MAX_SKILL_BODY_BYTES } from "@/lib/skills/limits";

export interface SkillValidationError {
  field:
    | "name"
    | "description"
    | "body"
    | "tags"
    | "paths"
    | "shell"
    | "frontmatter";
  code: string;
  message: string;
}

export type SkillValidationField = SkillValidationError["field"];

export interface SkillTemplate {
  id: string;
  label: string;
  description: string;
  category: string;
  initialFrontmatter: Record<string, unknown>;
  initialBody: string;
}

export interface GuidedStoredDraft {
  name?: string;
  frontmatter?: Record<string, unknown>;
  body?: string;
}

export interface SkillEditorSetupCheck {
  id: "name" | "description" | "body" | "tags";
  label: string;
  ready: boolean;
  message: string;
}

export function extraFrontmatterFields(
  frontmatter: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(frontmatter).filter(
      ([key]) => key !== "description" && key !== "tags",
    ),
  );
}

export function validateClientSkill(input: {
  name: string;
  description: string;
  tags: string[];
  body: string;
}): SkillValidationError[] {
  const errors: SkillValidationError[] = [];
  if (!/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(input.name.trim())) {
    errors.push({
      field: "name",
      code: "invalid_name",
      message:
        "Use lowercase letters, numbers, and hyphens. Do not start or end with a hyphen.",
    });
  }

  if (!input.description.trim()) {
    errors.push({
      field: "description",
      code: "missing_description",
      message: "Description is required.",
    });
  }

  if (!input.body.trim()) {
    errors.push({
      field: "body",
      code: "empty_body",
      message: "Skill body cannot be empty.",
    });
  }

  if (new TextEncoder().encode(input.body).length > MAX_SKILL_BODY_BYTES) {
    errors.push({
      field: "body",
      code: "body_too_large",
      message: `Skill body must be ${MAX_SKILL_BODY_BYTES} bytes or smaller.`,
    });
  }

  const lowerTags = input.tags.map((tag) => tag.toLowerCase());
  if (new Set(lowerTags).size !== lowerTags.length) {
    errors.push({
      field: "tags",
      code: "duplicate_tags",
      message: "Tags must be unique, ignoring case.",
    });
  }

  return errors;
}

export function buildSkillEditorSetupChecks({
  validationErrors,
  name,
  description,
  parsedTags,
  body,
}: {
  validationErrors: SkillValidationError[];
  name: string;
  description: string;
  parsedTags: string[];
  body: string;
}): SkillEditorSetupCheck[] {
  const hasError = (field: SkillValidationField) =>
    validationErrors.some((item) => item.field === field);

  return [
    {
      id: "name",
      label: "Skill name",
      ready: !hasError("name"),
      message: name.trim() ? "Valid local file name." : "Required before saving.",
    },
    {
      id: "description",
      label: "Description",
      ready: !hasError("description"),
      message: description.trim()
        ? "Invocation guidance is present."
        : "Tell Claude when this skill should be used.",
    },
    {
      id: "body",
      label: "Body",
      ready: !hasError("body"),
      message: body.trim()
        ? `${body.split("\n").length} lines drafted.`
        : "Add markdown instructions.",
    },
    {
      id: "tags",
      label: "Tags",
      ready: !hasError("tags"),
      message:
        parsedTags.length > 0
          ? `${parsedTags.length} tag${parsedTags.length === 1 ? "" : "s"} added.`
          : "Optional, but useful for discovery.",
    },
  ];
}
