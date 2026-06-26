export const API_ROUTES = {
  chat: "/api/chat",
  chatStatus: "/api/chat/status",
  export: "/api/export",
  exportZip: "/api/export/zip",
  index: "/api/index",
  releaseReadiness: "/api/release/readiness",
  settings: "/api/settings",
  settingsBrowse: "/api/settings/browse",
  settingsBrowseSearch: "/api/settings/browse/search",
  settingsClaudeCli: "/api/settings/claude-cli",
  settingsClaudeCliProfiles: "/api/settings/claude-cli/profiles",
  settingsClaudeCliTest: "/api/settings/claude-cli/test",
  settingsClaudeProject: "/api/settings/claude-project",
  settingsDoctor: "/api/settings/doctor",
  settingsNativeFolder: "/api/settings/native-folder",
  settingsPathExists: "/api/settings/path-exists",
  settingsRuntime: "/api/settings/runtime",
  skills: "/api/skills",
  skillsGuidedDraft: "/api/skills/guided/draft",
  skillsGuidedFeedback: "/api/skills/guided/feedback",
  skillsImportApply: "/api/skills/import/apply",
  skillsImportPreview: "/api/skills/import/preview",
  skillsTemplates: "/api/skills/templates",
  skillsValidation: "/api/skills/validation",
} as const;

export function apiSkillRoute(name: string): string {
  return `${API_ROUTES.skills}/${encodeURIComponent(name)}`;
}

export function apiSkillRestoreRoute(name: string): string {
  return `${apiSkillRoute(name)}/restore`;
}

export function apiSettingsBrowseRoute(path: string): string {
  return `${API_ROUTES.settingsBrowse}?path=${encodeURIComponent(path)}`;
}

export function apiSettingsNativeFolderRoute(params: URLSearchParams): string {
  return `${API_ROUTES.settingsNativeFolder}?${params.toString()}`;
}

export function apiSettingsPathExistsRoute(path: string): string {
  return `${API_ROUTES.settingsPathExists}?path=${encodeURIComponent(path)}`;
}
