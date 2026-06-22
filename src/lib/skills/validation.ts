import { SkillFrontmatter } from "@/types/skill";
import { isManagedSkillName } from "@/lib/skills/name";

export const MAX_SKILL_BODY_BYTES = 200_000;

export type SkillValidationCode =
  | "invalid_name"
  | "missing_description"
  | "empty_body"
  | "duplicate_tags"
  | "body_too_large"
  | "duplicate_name"
  | "unsafe_path_reference"
  | "unsafe_shell_command"
  | "invalid_frontmatter_type"
  | "invalid_frontmatter_syntax";

export interface SkillValidationError {
  field: "name" | "description" | "body" | "tags" | "paths" | "shell" | "frontmatter";
  code: SkillValidationCode;
  message: string;
}

export interface SkillValidationInput {
  name: string;
  frontmatter: Partial<SkillFrontmatter> | null | undefined;
  frontmatterParseError?: string | null;
  body: string;
}

export interface SkillValidationResult {
  ok: boolean;
  errors: SkillValidationError[];
}

export function isSafeSkillName(name: string): boolean {
  return isManagedSkillName(name);
}

export function normalizeSkillFrontmatter(
  value: unknown,
): Partial<SkillFrontmatter> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Partial<SkillFrontmatter>;
}

export function toWritableSkillFrontmatter(
  value: Partial<SkillFrontmatter>,
): SkillFrontmatter {
  return {
    ...value,
    description: typeof value.description === "string" ? value.description : "",
  };
}

function normalizedTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function hasUnsafePath(value: string): boolean {
  const normalized = value.replace(/\\/g, "/").trim();
  return (
    normalized.startsWith("/") ||
    /^[a-z]:\//i.test(normalized) ||
    normalized.split("/").includes("..")
  );
}

function isUnsafeShellCommand(value: string): boolean {
  const command = value.toLowerCase();
  return (
    /\brm\s+-rf\b/.test(command) ||
    /\bdel\s+\/[sq]\b/.test(command) ||
    /\bformat\s+[a-z]:/.test(command) ||
    /\bcurl\b[\s\S]*\|\s*(bash|sh|pwsh|powershell)\b/.test(command) ||
    /\biex\b|\binvoke-expression\b/.test(command)
  );
}

function validateOfficialFrontmatter(
  frontmatter: Partial<SkillFrontmatter> | null | undefined,
  errors: SkillValidationError[],
) {
  if (!frontmatter) return;

  for (const key of ["paths", "context"] as const) {
    for (const value of stringArray(frontmatter[key])) {
      if (hasUnsafePath(value)) {
        errors.push({
          field: "paths",
          code: "unsafe_path_reference",
          message:
            "Frontmatter paths must stay inside the selected skill package and cannot use absolute paths or '..'.",
        });
        break;
      }
    }
  }

  const shell = frontmatter.shell;
  if (shell && typeof shell !== "object") {
    errors.push({
      field: "shell",
      code: "invalid_frontmatter_type",
      message: "shell frontmatter must be an object with a command string.",
    });
  }

  const shellCommand =
    shell && typeof shell === "object" && typeof shell.command === "string"
      ? shell.command
      : "";
  if (shellCommand && isUnsafeShellCommand(shellCommand)) {
    errors.push({
      field: "shell",
      code: "unsafe_shell_command",
      message:
        "Shell metadata contains a destructive or remote-pipe command and must be rewritten before saving.",
    });
  }
}

export function validateSkillInput(
  input: SkillValidationInput,
): SkillValidationResult {
  const errors: SkillValidationError[] = [];
  const name = input.name.trim();
  const description =
    typeof input.frontmatter?.description === "string"
      ? input.frontmatter.description.trim()
      : "";
  const body = input.body ?? "";
  const tags = normalizedTags(input.frontmatter?.tags);
  const lowerTags = tags.map((tag) => tag.toLowerCase());
  const uniqueTags = new Set(lowerTags);

  if (input.frontmatterParseError) {
    errors.push({
      field: "frontmatter",
      code: "invalid_frontmatter_syntax",
      message: `${input.frontmatterParseError} Fix the metadata block before saving or importing.`,
    });
  }

  if (!isSafeSkillName(name)) {
    errors.push({
      field: "name",
      code: "invalid_name",
      message:
        "Skill name must use lowercase letters, numbers, and hyphens, without path separators.",
    });
  }

  if (!description) {
    errors.push({
      field: "description",
      code: "missing_description",
      message: "Description is required.",
    });
  }

  if (!body.trim()) {
    errors.push({
      field: "body",
      code: "empty_body",
      message: "Skill body cannot be empty.",
    });
  }

  if (Buffer.byteLength(body, "utf8") > MAX_SKILL_BODY_BYTES) {
    errors.push({
      field: "body",
      code: "body_too_large",
      message: `Skill body must be ${MAX_SKILL_BODY_BYTES} bytes or smaller.`,
    });
  }

  if (uniqueTags.size !== lowerTags.length) {
    errors.push({
      field: "tags",
      code: "duplicate_tags",
      message: "Tags must be unique, ignoring case.",
    });
  }

  validateOfficialFrontmatter(input.frontmatter, errors);

  return {
    ok: errors.length === 0,
    errors,
  };
}
