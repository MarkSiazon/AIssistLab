export function skillEditorHref(skillName: string): string {
  return `/editor/${encodeURIComponent(skillName)}`;
}

export function skillExportHref(skillName: string): string {
  const params = new URLSearchParams({ skill: skillName });
  return `/api/export?${params.toString()}`;
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
  return query ? `/api/export/zip?${query}` : "/api/export/zip";
}
