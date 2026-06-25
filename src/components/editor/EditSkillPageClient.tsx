"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SkillEditorForm } from "@/components/editor/SkillEditorForm";
import { EmptyStateIcon } from "@/components/ui/EmptyStateIcon";
import { requestJson } from "@/lib/api/client";
import { APP_ROUTES } from "@/lib/routes/app-routes";
import { apiSkillRoute } from "@/lib/routes/api-routes";
import { Skill } from "@/types/skill";

export function EditSkillPageClient({ skillName }: { skillName: string }) {
  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestJson<Skill>(
      apiSkillRoute(skillName),
      undefined,
      "Skill not found",
    )
      .then(setSkill)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [skillName]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="ui-panel ui-empty-state" role="status">
          <EmptyStateIcon name="editor" label="Skill editor" />
          <div>
            <h1 className="m-0 text-sm font-semibold">Loading skill</h1>
            <div
              className="text-sm mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              Preparing the editor and markdown preview.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="ui-panel ui-empty-state" role="alert">
          <EmptyStateIcon name="editor" label="Skill missing" />
          <div>
            <h1 className="m-0 text-sm font-semibold">Skill not available</h1>
            <div
              className="text-sm mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              {error ?? "The selected skill could not be found."}
            </div>
          </div>
          <Link
            href={APP_ROUTES.skills}
            className="ui-button ui-button-primary"
          >
            Back to Skills
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SkillEditorForm
      mode="edit"
      initialName={skill.name}
      initialDescription={skill.frontmatter.description}
      initialTags={skill.frontmatter.tags ?? []}
      initialFrontmatter={skill.frontmatter}
      initialBody={skill.body}
    />
  );
}
