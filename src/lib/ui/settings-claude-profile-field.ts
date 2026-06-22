import {
  profileOptionLabel,
  profileStatusColor,
  profileStatusText,
} from "@/lib/ui/settings-status";

export interface SettingsClaudeProfileSummary {
  id: string;
  label: string;
  source: "default" | "discovered" | "manual";
  displayPath: string;
  selected: boolean;
  exists: boolean;
  auth: {
    checked: boolean;
    loggedIn: boolean | null;
    method: string | null;
    error: string | null;
  };
}

export interface SettingsClaudeCliTestSummary {
  checked: boolean;
  ok: boolean | null;
  output: string | null;
  error: string | null;
}

export interface SettingsClaudeProfileOption {
  value: string;
  label: string;
}

export interface SettingsClaudeProfileTestState {
  label: string;
  detail: string;
  color: string;
}

export interface SettingsClaudeProfileFieldState {
  isManual: boolean;
  selectValue: string;
  options: SettingsClaudeProfileOption[];
  summaryLabel: string;
  summaryStatus: string;
  summaryPath: string;
  summaryColor: string;
  testResult: SettingsClaudeCliTestSummary | null;
  test: SettingsClaudeProfileTestState | null;
}

function getSelectedProfile({
  profiles,
  selectedProfile,
  selectedProfileId,
  isManual,
}: {
  profiles: readonly SettingsClaudeProfileSummary[];
  selectedProfile: SettingsClaudeProfileSummary | undefined;
  selectedProfileId: string;
  isManual: boolean;
}): SettingsClaudeProfileSummary | undefined {
  if (isManual) return undefined;
  return (
    profiles.find((profile) => profile.id === selectedProfileId) ??
    selectedProfile
  );
}

function getTestState({
  testResult,
  testIsCurrent,
}: {
  testResult: SettingsClaudeCliTestSummary | null;
  testIsCurrent: boolean;
}): SettingsClaudeProfileTestState | null {
  if (!testResult) return null;

  if (!testIsCurrent) {
    return {
      label: "Test not run for this profile",
      detail: "",
      color: "var(--yellow)",
    };
  }

  return {
    label: testResult.ok ? "Test passed" : "Test failed",
    detail:
      testResult.ok && testResult.output
        ? `: ${testResult.output}`
        : testResult.error
          ? `: ${testResult.error}`
          : "",
    color: testResult.ok ? "var(--green)" : "var(--yellow)",
  };
}

export function getSettingsClaudeProfileFieldState({
  profiles,
  selectedProfile,
  selectedProfileId,
  manualPath,
  testResult,
  testIsCurrent,
}: {
  profiles: readonly SettingsClaudeProfileSummary[];
  selectedProfile: SettingsClaudeProfileSummary | undefined;
  selectedProfileId: string;
  manualPath: string;
  testResult: SettingsClaudeCliTestSummary | null;
  testIsCurrent: boolean;
}): SettingsClaudeProfileFieldState {
  const isManual = selectedProfileId === "manual";
  const resolvedProfile = getSelectedProfile({
    profiles,
    selectedProfile,
    selectedProfileId,
    isManual,
  });

  return {
    isManual,
    selectValue: isManual ? "__manual__" : resolvedProfile?.id ?? "default",
    options:
      profiles.length > 0
        ? profiles.map((profile) => ({
            value: profile.id,
            label: profileOptionLabel(profile),
          }))
        : [{ value: "", label: "Default profile - Not checked" }],
    summaryLabel: isManual
      ? "Manual path"
      : resolvedProfile?.label ?? "Default profile",
    summaryStatus: isManual ? "Not checked" : profileStatusText(resolvedProfile),
    summaryPath: isManual
      ? manualPath || "No manual path selected"
      : resolvedProfile?.displayPath ?? "~\\.claude",
    summaryColor: isManual
      ? "var(--text-muted)"
      : profileStatusColor(resolvedProfile),
    testResult,
    test: getTestState({ testResult, testIsCurrent }),
  };
}
