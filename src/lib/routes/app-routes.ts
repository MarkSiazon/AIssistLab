export const APP_ROUTES = {
  chat: "/chat",
  editor: "/editor",
  editorGuidedDraft: "/editor?guidedDraft=1",
  guidedBuilder: "/editor/guided",
  export: "/export",
  exportDiagnostics: "/export?diagnostics=true",
  settings: "/settings",
  skills: "/skills",
} as const;

export function appSkillEditorRoute(skillName: string): string {
  return `${APP_ROUTES.editor}/${encodeURIComponent(skillName)}`;
}
