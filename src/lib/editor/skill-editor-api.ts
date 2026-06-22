import { jsonRequestInit, readResponseJson } from "@/lib/api/client";
import type { SkillValidationError } from "@/lib/ui/skill-editor-model";

export interface SkillEditorSaveInput {
  mode: "create" | "edit";
  name: string;
  description: string;
  tags: string[];
  body: string;
  templateFrontmatter: Record<string, unknown>;
}

export interface SkillEditorSaveResult {
  ok: boolean;
  error: string | null;
  validationErrors: SkillValidationError[];
  indexStateStatus: string | null;
}

interface SkillEditorSavePayload {
  error?: unknown;
  validationErrors?: unknown;
  indexState?: {
    status?: unknown;
  };
}

function parseValidationErrors(value: unknown): SkillValidationError[] {
  return Array.isArray(value) ? (value as SkillValidationError[]) : [];
}

export async function saveSkillEditor(input: SkillEditorSaveInput): Promise<SkillEditorSaveResult> {
  const frontmatter = {
    ...input.templateFrontmatter,
    description: input.description,
    tags: input.tags,
  };
  const response =
    input.mode === "create"
      ? await fetch(
          "/api/skills",
          jsonRequestInit("POST", {
            name: input.name,
            frontmatter,
            content: input.body,
          }),
        )
      : await fetch(
          `/api/skills/${encodeURIComponent(input.name)}`,
          jsonRequestInit("PUT", {
            frontmatter,
            body: input.body,
          }),
        );

  const data = (await readResponseJson(response)) as SkillEditorSavePayload;
  return {
    ok: response.ok,
    error: typeof data.error === "string" ? data.error : null,
    validationErrors: parseValidationErrors(data.validationErrors),
    indexStateStatus:
      typeof data.indexState?.status === "string"
        ? data.indexState.status
        : null,
  };
}
