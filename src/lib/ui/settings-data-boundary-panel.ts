export type SettingsDataBoundaryTone =
  | "local"
  | "explicit"
  | "sanitized"
  | "manual";

export interface SettingsDataBoundaryItem {
  id: string;
  label: string;
  summary: string;
  detail: string;
  tone: SettingsDataBoundaryTone;
}

export interface SettingsDataBoundaryPanelModel {
  title: string;
  subtitle: string;
  items: SettingsDataBoundaryItem[];
  footer: string;
}

export const settingsDataBoundaryItems: SettingsDataBoundaryItem[] = [
  {
    id: "workspace-files",
    label: "Workspace files",
    summary: "Read locally from configured workspace and skills paths.",
    detail:
      "The app avoids broad device scans. Skill reads and writes stay limited to the configured workspace and skills directory.",
    tone: "local",
  },
  {
    id: "rag-chat",
    label: "RAG chat",
    summary: "Provider context is sent only when you send a chat message.",
    detail:
      "The selected provider receives your prompt plus retrieved skill excerpts and citation metadata. Settings does not run generation on page load.",
    tone: "explicit",
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    summary: "Exported only by action and scrubbed before packaging.",
    detail:
      "Diagnostics omit API keys, account identifiers, OAuth paths, raw profile names, home paths, hook commands, and raw provider output.",
    tone: "sanitized",
  },
  {
    id: "manual-checks",
    label: "Manual checks",
    summary: "OS dialogs, login, and account-backed chat stay user-owned.",
    detail:
      "Manual QA stores only status and timestamp in this browser, or in memory when browser storage is unavailable.",
    tone: "manual",
  },
];

export function getSettingsDataBoundaryPanelModel(): SettingsDataBoundaryPanelModel {
  return {
    title: "Data Boundary",
    subtitle:
      "What stays local, what leaves only after an explicit action, and what remains manual.",
    items: settingsDataBoundaryItems,
    footer:
      "Use Release Readiness for automated blockers. Mark Manual QA Evidence only after the local device or account check was actually performed.",
  };
}

export function settingsDataBoundaryToneClassName(
  tone: SettingsDataBoundaryTone,
): string {
  return `settings-data-boundary-tone-${tone}`;
}
