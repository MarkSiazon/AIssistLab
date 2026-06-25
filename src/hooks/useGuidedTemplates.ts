"use client";

import { useEffect, useMemo, useState } from "react";
import { optionalJson } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/routes/api-routes";
import {
  templateDefaultId,
  type SkillTemplateSummary,
} from "@/lib/ui/guided-builder-model";

export function useGuidedTemplates(
  templateId: string,
  setTemplateId: (templateId: string | ((previous: string) => string)) => void,
) {
  const [templates, setTemplates] = useState<SkillTemplateSummary[]>([]);

  useEffect(() => {
    optionalJson<{ templates?: SkillTemplateSummary[] }>(
      API_ROUTES.skillsTemplates,
    )
      .then((payload) => {
        const nextTemplates = Array.isArray(payload?.templates)
          ? payload.templates
          : [];
        setTemplates(nextTemplates);
        setTemplateId((previous) => {
          if (nextTemplates.some((template) => template.id === previous)) {
            return previous;
          }
          return templateDefaultId(nextTemplates);
        });
      })
      .catch(() => setTemplates([]));
  }, [setTemplateId]);

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === templateId),
    [templateId, templates],
  );

  return {
    templates,
    selectedTemplate,
  };
}
