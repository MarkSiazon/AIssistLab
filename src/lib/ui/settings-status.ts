import {
  indexStatusColor as baseIndexStatusColor,
  indexStatusLabel as baseIndexStatusLabel,
  type RagIndexStatus,
} from "./index-status-summary";

export type SettingsDoctorStatus = "ok" | "warn" | "error";
export type SettingsDoctorSeverity = "blocking" | "warning" | "optional";
export type SettingsIndexStatus = RagIndexStatus;
export type SettingsReleaseStatus = "ready" | "needs_action" | "blocked";
export type SettingsFirstRunStatus = "ready" | "needs_action" | "optional";
export type SettingsPathState = "idle" | "checking" | "ok" | "error";
export type SettingsTone = "ok" | "warn" | "error" | "neutral";

export interface SettingsProfileStatus {
  label: string;
  auth: {
    checked: boolean;
    loggedIn: boolean | null;
  };
}

export function doctorStatusColor(status: SettingsDoctorStatus): string {
  if (status === "error") return "var(--red)";
  if (status === "warn") return "var(--yellow)";
  return "var(--green)";
}

export function doctorSeverityLabel(
  severity: SettingsDoctorSeverity,
): string {
  if (severity === "blocking") return "Blocking";
  if (severity === "warning") return "Warning";
  return "Optional";
}

export function indexStatusColor(status: SettingsIndexStatus): string {
  return baseIndexStatusColor(status);
}

export function indexStatusLabel(status: SettingsIndexStatus): string {
  return baseIndexStatusLabel(status);
}

export function releaseStatusColor(status: SettingsReleaseStatus): string {
  if (status === "ready") return "var(--green)";
  if (status === "blocked") return "var(--red)";
  return "var(--yellow)";
}

export function releaseStatusLabel(status: SettingsReleaseStatus): string {
  if (status === "ready") return "Ready";
  if (status === "blocked") return "Blocked";
  return "Needs action";
}

export function releaseStatusTone(status: SettingsReleaseStatus): SettingsTone {
  if (status === "ready") return "ok";
  if (status === "blocked") return "error";
  return "warn";
}

export function firstRunStatusColor(status: SettingsFirstRunStatus): string {
  if (status === "ready") return "var(--green)";
  if (status === "optional") return "var(--text-muted)";
  return "var(--yellow)";
}

export function firstRunStatusClass(status: SettingsFirstRunStatus): string {
  if (status === "ready") return "settings-first-run-item-ready";
  if (status === "optional") return "settings-first-run-item-optional";
  return "settings-first-run-item-needs-action";
}

export function pathStateLabel(state: SettingsPathState): string {
  if (state === "ok") return "Valid";
  if (state === "error") return "Needs fix";
  if (state === "checking") return "Checking";
  return "Not checked";
}

export function pathStateTone(state: SettingsPathState): SettingsTone {
  if (state === "ok") return "ok";
  if (state === "error") return "error";
  if (state === "checking") return "warn";
  return "neutral";
}

export function pathStateBadgePresentation(
  state: SettingsPathState,
): { text: string; color: string } | null {
  if (state === "checking") {
    return { text: "checking...", color: "var(--text-muted)" };
  }
  if (state === "ok") return { text: "found", color: "var(--green)" };
  if (state === "error") return { text: "not found", color: "var(--red)" };
  return null;
}

export function profileStatusText(
  profile: SettingsProfileStatus | undefined,
): string {
  if (!profile?.auth.checked) return "Not checked";
  if (profile.auth.loggedIn === true) return "Signed in";
  if (profile.auth.loggedIn === false) return "Not signed in";
  return "Not checked";
}

export function profileStatusColor(
  profile: SettingsProfileStatus | undefined,
): string {
  if (!profile?.auth.checked) return "var(--text-muted)";
  if (profile.auth.loggedIn === true) return "var(--green)";
  if (profile.auth.loggedIn === false) return "var(--yellow)";
  return "var(--text-muted)";
}

export function profileOptionLabel(profile: SettingsProfileStatus): string {
  return `${profile.label} - ${profileStatusText(profile)}`;
}
