"use client";

import { useEffect, useState } from "react";
import { optionalJson } from "@/lib/api/client";
import {
  extraFrontmatterFields,
  type GuidedStoredDraft,
  type SkillTemplate,
} from "@/lib/ui/skill-editor-model";
import {
  clearGuidedDraftFromStorage,
  readGuidedDraftFromStorage,
} from "@/lib/ui/guided-draft-storage";

export interface SkillEditorDraftValues {
  name?: string;
  description: string;
  tagsInput: string;
  body?: string;
  templateFrontmatter: Record<string, unknown>;
}

export function valuesFromGuidedDraft(
  draft: GuidedStoredDraft,
): SkillEditorDraftValues {
  const frontmatter =
    draft.frontmatter &&
    typeof draft.frontmatter === "object" &&
    !Array.isArray(draft.frontmatter)
      ? draft.frontmatter
      : {};

  return {
    name: typeof draft.name === "string" ? draft.name : undefined,
    body: typeof draft.body === "string" ? draft.body : undefined,
    description:
      typeof frontmatter.description === "string"
        ? frontmatter.description
        : "",
    tagsInput: Array.isArray(frontmatter.tags)
      ? frontmatter.tags.filter((tag) => typeof tag === "string").join(", ")
      : "",
    templateFrontmatter: extraFrontmatterFields(frontmatter),
  };
}

export function useSkillEditorBootstrap({
  mode,
  onGuidedDraft,
}: {
  mode: "create" | "edit";
  onGuidedDraft: (values: SkillEditorDraftValues) => void;
}) {
  const [templates, setTemplates] = useState<SkillTemplate[]>([]);

  useEffect(() => {
    if (mode !== "create") return;
    optionalJson<{ templates?: SkillTemplate[] }>("/api/skills/templates")
      .then((payload) => {
        if (Array.isArray(payload?.templates)) setTemplates(payload.templates);
      })
      .catch(() => setTemplates([]));
  }, [mode]);

  useEffect(() => {
    if (mode !== "create") return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("guidedDraft")) return;

    const draft = readGuidedDraftFromStorage(sessionStorage) as
      | GuidedStoredDraft
      | null;
    if (!draft) {
      clearGuidedDraftFromStorage(sessionStorage);
      return;
    }

    try {
      onGuidedDraft(valuesFromGuidedDraft(draft));
    } catch {
      // Invalid stored drafts are ignored and cleared below.
    } finally {
      clearGuidedDraftFromStorage(sessionStorage);
    }
  }, [mode, onGuidedDraft]);

  return { templates };
}
