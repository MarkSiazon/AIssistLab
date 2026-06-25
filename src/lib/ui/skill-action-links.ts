import { appSkillEditorRoute } from "@/lib/routes/app-routes";
import { API_ROUTES } from "@/lib/routes/api-routes";

export function skillEditorHref(skillName: string): string {
  return appSkillEditorRoute(skillName);
}

export function skillExportHref(skillName: string): string {
  const params = new URLSearchParams({ skill: skillName });
  return `${API_ROUTES.export}?${params.toString()}`;
}

export function skillsZipExportHref(input: {
  selectedSkills?: Iterable<string>;
  includeDiagnostics?: boolean;
} = {}): string {
  const params = new URLSearchParams();
  const selectedSkills = Array.from(input.selectedSkills ?? []);

  for (const skillName of selectedSkills) {
    params.append("skill", skillName);
  }
  if (input.includeDiagnostics) {
    params.set("diagnostics", "true");
  }

  const query = params.toString();
  return query ? `${API_ROUTES.exportZip}?${query}` : API_ROUTES.exportZip;
}
