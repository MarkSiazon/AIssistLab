export type SkillTemplateCategory =
  | "reference"
  | "workflow"
  | "command"
  | "subagent"
  | "learning";

export interface SkillTemplate {
  id: string;
  label: string;
  description: string;
  category: SkillTemplateCategory;
  initialFrontmatter: Record<string, unknown>;
  initialBody: string;
}

const TEMPLATES: SkillTemplate[] = [
  {
    id: "reference-skill",
    label: "Reference Skill",
    description: "Capture stable reference material with clear lookup guidance.",
    category: "reference",
    initialFrontmatter: {
      description: "Reference facts and examples for a focused topic.",
      tags: ["reference"],
      when_to_use: "Use when the user asks for facts, examples, or constraints from this topic.",
    },
    initialBody: `## Purpose

Use this skill when the user needs reliable reference material about a focused topic.

## Source Notes

- Add the canonical source or folder this skill summarizes.
- Keep examples short and concrete.
- Prefer stable facts over broad commentary.

## Answering Guidance

- Cite the relevant section when responding.
- Say when the answer is not covered by this reference.
`,
  },
  {
    id: "workflow-skill",
    label: "Workflow Skill",
    description: "Guide a repeated task from intake through verification.",
    category: "workflow",
    initialFrontmatter: {
      description: "Step-by-step workflow for completing a repeated task.",
      tags: ["workflow"],
      when_to_use: "Use when the user asks to perform this repeated workflow end to end.",
    },
    initialBody: `## Intake

- Confirm the target files, folders, or user-visible output.
- Identify the existing source of truth before editing.

## Steps

1. Inspect the current state.
2. Make the smallest scoped change.
3. Run the documented verification.
4. Report what changed and what remains.

## Verification

- List the commands or browser checks that prove the workflow worked.
`,
  },
  {
    id: "command-style",
    label: "Command-Style Skill",
    description: "Document arguments, expected command behavior, and safety limits.",
    category: "command",
    initialFrontmatter: {
      description: "Command-style skill with explicit arguments and safety boundaries.",
      tags: ["command"],
      "argument-hint": "[target]",
      arguments: [{ name: "target", required: true }],
      "user-invocable": true,
      "allowed-tools": ["Read", "Grep", "Bash"],
    },
    initialBody: `## Command

Use this command when the user provides a target and expects a concrete action.

## Arguments

- \`target\`: The file, folder, issue, or topic to process.

## Behavior

1. Validate the target.
2. Inspect the existing context.
3. Apply the documented action.
4. Return a concise result with verification evidence.

## Safety

- Do not run destructive shell commands without explicit confirmation.
- Do not expose secrets, tokens, or private account identifiers.
`,
  },
  {
    id: "subagent-backed",
    label: "Subagent-Backed Skill",
    description: "Coordinate a larger task while keeping sub-agent boundaries clear.",
    category: "subagent",
    initialFrontmatter: {
      description: "Coordinate independent sub-agent work for a larger task.",
      tags: ["subagent", "coordination"],
      agent: "coordinator",
      when_to_use: "Use when the task can be split into independent research, implementation, or review tracks.",
    },
    initialBody: `## Coordination Model

Use this skill when a task benefits from independent workstreams.

## Work Split

- Agent A: inspect current repo behavior.
- Agent B: research source docs or existing patterns.
- Agent C: review privacy, safety, and verification gaps.

## Merge Rules

- Keep changes scoped to the request.
- Require each workstream to report evidence.
- Resolve conflicts in the main session before final verification.
`,
  },
  {
    id: "learning-rubric",
    label: "Learning And Rubric Skill",
    description: "Coach a user through learning with prompts, examples, and rubric feedback.",
    category: "learning",
    initialFrontmatter: {
      description: "Guide learning through Socratic prompts, examples, and rubric feedback.",
      tags: ["learning", "rubric"],
      when_to_use: "Use when the user wants to learn or improve a skill instead of only receiving an answer.",
    },
    initialBody: `## Learning Goal

Help the user understand the concept by asking focused questions before giving the final answer.

## Coaching Flow

1. Ask what the user already tried.
2. Offer one hint at a time.
3. Use a small worked example only after the user attempts the task.

## Rubric

- Clarity: The user can explain the main idea in their own words.
- Application: The user can apply the idea to a new example.
- Verification: The user can tell whether their result is correct.

## Feedback

Give specific, actionable feedback tied to the rubric.
`,
  },
];

export function listSkillTemplates(): SkillTemplate[] {
  return TEMPLATES.map((template) => ({
    ...template,
    initialFrontmatter: { ...template.initialFrontmatter },
  }));
}

export function getSkillTemplate(id: string): SkillTemplate | null {
  if (!/^[a-z0-9-]+$/.test(id)) return null;
  const template = TEMPLATES.find((item) => item.id === id);
  return template
    ? { ...template, initialFrontmatter: { ...template.initialFrontmatter } }
    : null;
}
