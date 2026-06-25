import { Skill } from "@/types/skill";
import { parseFrontmatter } from "@/lib/markdown/frontmatter";
import { validateSkillInput } from "@/lib/skills/validation";

type SkillQualityCode =
  | "duplicate_skill_name"
  | "missing_description"
  | "description_too_generic"
  | "missing_trigger_example"
  | "supporting_file_reference"
  | "dynamic_command_usage"
  | "unsafe_instruction"
  | "high_context_cost"
  | "weak_tags"
  | "short_body"
  | "heading_level_jump"
  | "invalid_skill";

type SkillQualityCategory =
  | "discoverability"
  | "safety"
  | "maintainability"
  | "portability"
  | "context_cost";

export interface SkillQualityIssue {
  skillName: string;
  code: SkillQualityCode;
  category: SkillQualityCategory;
  severity: "warn" | "error";
  message: string;
}

export interface SkillQualityReport {
  totalSkills: number;
  issueCount: number;
  issues: SkillQualityIssue[];
}

function headingLevels(body: string): number[] {
  return body
    .split("\n")
    .map((line) => /^(#{1,6})\s+/.exec(line)?.[1].length)
    .filter((level): level is number => typeof level === "number");
}

function pushIssue(
  issues: SkillQualityIssue[],
  issue: SkillQualityIssue,
): void {
  issues.push(issue);
}

function descriptionIsGeneric(description: string): boolean {
  const normalized = description.trim().toLowerCase();
  return (
    normalized.split(/\s+/).filter(Boolean).length < 4 ||
    /^(does things|helps with tasks|useful skill|general helper)\.?$/.test(
      normalized,
    )
  );
}

function hasTriggerExample(skill: Skill): boolean {
  const whenToUse = skill.frontmatter.when_to_use;
  return (
    (typeof whenToUse === "string" && whenToUse.trim().length >= 16) ||
    /use when|when the user|trigger|example prompt/i.test(skill.body)
  );
}

function hasDynamicCommandUsage(skill: Skill): boolean {
  const shellCommand =
    typeof skill.frontmatter.shell?.command === "string"
      ? skill.frontmatter.shell.command
      : "";
  return /\$\{[^}]+}|<[^>\n]+>|\$\w+|%\w+%/.test(
    `${shellCommand}\n${skill.body}`,
  );
}

function hasUnsafeInstruction(skill: Skill): boolean {
  const text = `${skill.frontmatter.shell?.command ?? ""}\n${skill.body}`;
  return /reveal secrets|ignore safety|bypass auth|curl[\s\S]*\|\s*(bash|sh|pwsh|powershell)/i.test(
    text,
  );
}

function supportingReferences(skill: Skill): string[] {
  const paths = Array.isArray(skill.frontmatter.paths)
    ? skill.frontmatter.paths
    : [];
  const context = Array.isArray(skill.frontmatter.context)
    ? skill.frontmatter.context
    : [];
  return [...paths, ...context].filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
}

export function buildSkillQualityReport(skills: Skill[]): SkillQualityReport {
  const issues: SkillQualityIssue[] = [];
  const namesByLower = new Map<string, string[]>();

  for (const skill of skills) {
    const key = skill.name.toLowerCase();
    namesByLower.set(key, [...(namesByLower.get(key) ?? []), skill.name]);
  }

  for (const names of Array.from(namesByLower.values())) {
    if (names.length > 1) {
      for (const name of names) {
        pushIssue(issues, {
          skillName: name,
          code: "duplicate_skill_name",
          category: "discoverability",
          severity: "error",
          message: "Another skill has the same name when casing is ignored.",
        });
      }
    }
  }

  for (const skill of skills) {
    const validation = validateSkillInput({
      name: skill.name,
      frontmatter: skill.frontmatter,
      frontmatterParseError: skill.raw
        ? parseFrontmatter(skill.raw).error
        : null,
      body: skill.body,
    });

    for (const error of validation.errors) {
      pushIssue(issues, {
        skillName: skill.name,
        code:
          error.code === "missing_description"
            ? "missing_description"
            : "invalid_skill",
        category:
          error.code === "missing_description"
            ? "discoverability"
            : error.code === "unsafe_shell_command" ||
                error.code === "unsafe_path_reference"
              ? "safety"
              : "maintainability",
        severity: error.code === "invalid_name" ? "error" : "warn",
        message: error.message,
      });
    }

    if ((skill.frontmatter.tags ?? []).length === 0) {
      pushIssue(issues, {
        skillName: skill.name,
        code: "weak_tags",
        category: "discoverability",
        severity: "warn",
        message: "Skill has no tags, which makes browsing and filtering weaker.",
      });
    }

    const description =
      typeof skill.frontmatter.description === "string"
        ? skill.frontmatter.description
        : "";
    if (description && descriptionIsGeneric(description)) {
      pushIssue(issues, {
        skillName: skill.name,
        code: "description_too_generic",
        category: "discoverability",
        severity: "warn",
        message:
          "Description is too generic to help users decide when to use this skill.",
      });
    }

    if (!hasTriggerExample(skill)) {
      pushIssue(issues, {
        skillName: skill.name,
        code: "missing_trigger_example",
        category: "discoverability",
        severity: "warn",
        message:
          "Skill should include when-to-use guidance or an example trigger prompt.",
      });
    }

    if (supportingReferences(skill).length > 0) {
      pushIssue(issues, {
        skillName: skill.name,
        code: "supporting_file_reference",
        category: "maintainability",
        severity: "warn",
        message:
          "Skill references supporting files; confirm those files are packaged with the skill.",
      });
    }

    if (hasDynamicCommandUsage(skill)) {
      pushIssue(issues, {
        skillName: skill.name,
        code: "dynamic_command_usage",
        category: "portability",
        severity: "warn",
        message:
          "Skill uses dynamic command placeholders; document accepted values and safe defaults.",
      });
    }

    if (hasUnsafeInstruction(skill)) {
      pushIssue(issues, {
        skillName: skill.name,
        code: "unsafe_instruction",
        category: "safety",
        severity: "error",
        message:
          "Skill contains unsafe instruction text or remote-pipe shell behavior.",
      });
    }

    if (skill.body.trim().length < 80) {
      pushIssue(issues, {
        skillName: skill.name,
        code: "short_body",
        category: "context_cost",
        severity: "warn",
        message: "Skill body is short enough that it may not be useful for RAG.",
      });
    }

    if (skill.body.length > 6000) {
      pushIssue(issues, {
        skillName: skill.name,
        code: "high_context_cost",
        category: "context_cost",
        severity: "warn",
        message:
          "Skill body is large; consider moving reference material into supporting files.",
      });
    }

    const levels = headingLevels(skill.body);
    for (let index = 1; index < levels.length; index += 1) {
      if (levels[index] > levels[index - 1] + 1) {
        pushIssue(issues, {
          skillName: skill.name,
          code: "heading_level_jump",
          category: "maintainability",
          severity: "warn",
          message: "Markdown heading levels skip a level.",
        });
        break;
      }
    }
  }

  return {
    totalSkills: skills.length,
    issueCount: issues.length,
    issues,
  };
}
