import type { ReactNode } from "react";
import { PathPicker } from "@/components/settings/PathPicker";
import {
  getSettingsClaudeProfileFieldState,
  type SettingsClaudeCliTestSummary,
  type SettingsClaudeProfileSummary,
} from "@/lib/ui/settings-claude-profile-field";
import { settingsManualPathInputId } from "@/lib/ui/settings-field-ids";
import type { SettingsPathState } from "@/lib/ui/settings-status";

interface ClaudeProfileFieldProps {
  fieldKey: string;
  fieldId: string;
  hintId: string;
  profiles: SettingsClaudeProfileSummary[];
  selectedProfile: SettingsClaudeProfileSummary | undefined;
  selectedProfileId: string;
  manualPath: string;
  pathState: SettingsPathState;
  testResult: SettingsClaudeCliTestSummary | null;
  testIsCurrent: boolean;
  actionLoading: boolean;
  testLoading: boolean;
  canOpenLogin: boolean;
  cliInstalled: boolean;
  profileActionDisabled: boolean;
  renderPathBadge: (state: SettingsPathState) => ReactNode;
  onSelectProfile: (next: {
    profileId: string;
    manualConfigDir: string;
  }) => void;
  onManualPathChange: (value: string) => void;
  onOpenLogin: () => void;
  onTestCli: () => void;
}

export function ClaudeProfileField({
  fieldKey,
  fieldId,
  hintId,
  profiles,
  selectedProfile,
  selectedProfileId,
  manualPath,
  pathState,
  testResult,
  testIsCurrent,
  actionLoading,
  testLoading,
  canOpenLogin,
  cliInstalled,
  profileActionDisabled,
  renderPathBadge,
  onSelectProfile,
  onManualPathChange,
  onOpenLogin,
  onTestCli,
}: ClaudeProfileFieldProps) {
  const state = getSettingsClaudeProfileFieldState({
    profiles,
    selectedProfile,
    selectedProfileId,
    manualPath,
    testResult,
    testIsCurrent,
  });

  return (
    <div className="flex flex-col gap-2">
      <select
        id={fieldId}
        value={state.selectValue}
        onChange={(event) => {
          if (event.target.value === "__manual__") {
            onSelectProfile({
              profileId: "manual",
              manualConfigDir: manualPath,
            });
            return;
          }

          onSelectProfile({
            profileId: event.target.value,
            manualConfigDir: "",
          });
        }}
        aria-describedby={hintId}
        className="w-full text-sm px-3 py-2 rounded border outline-none"
        style={{
          background: "var(--surface-2)",
          borderColor: "var(--border)",
          color: "var(--text)",
          minHeight: "44px",
        }}
      >
        {state.options.map((option) => (
          <option key={option.value || "default"} value={option.value}>
            {option.label}
          </option>
        ))}
        <option value="__manual__">Manual path</option>
      </select>

      <div
        className="rounded border p-2"
        style={{
          borderColor: "var(--border)",
          background: "var(--surface-2)",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: state.summaryColor }}
          />
          <span className="text-xs font-medium">{state.summaryLabel}</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {state.summaryStatus}
          </span>
        </div>
        <div
          className="text-xs font-mono mt-1 break-all"
          title={state.summaryPath}
          style={{ color: "var(--text-muted)", lineHeight: 1.45 }}
        >
          {state.summaryPath}
        </div>
      </div>

      {state.isManual && (
        <div className="flex flex-col gap-1.5">
          <PathPicker
            value={manualPath}
            onChange={onManualPathChange}
            label="Select Claude profile directory"
            inputId={settingsManualPathInputId(fieldKey)}
            describedBy={hintId}
          />
          {renderPathBadge(pathState)}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpenLogin}
          disabled={actionLoading || !canOpenLogin || profileActionDisabled}
          className="ui-button ui-button-subtle text-xs"
        >
          {actionLoading ? "Opening..." : "Open Login"}
        </button>
        <button
          type="button"
          onClick={onTestCli}
          disabled={testLoading || !cliInstalled || profileActionDisabled}
          className="ui-button ui-button-subtle text-xs"
        >
          {testLoading ? "Testing..." : "Test CLI"}
        </button>
      </div>

      {state.test && (
        <div
          className="text-xs rounded border p-2"
          style={{
            borderColor: "var(--border)",
            color: state.test.color,
            background: "var(--surface-2)",
            lineHeight: 1.45,
          }}
        >
          <span className="font-medium">{state.test.label}</span>
          {state.test.detail}
        </div>
      )}
    </div>
  );
}
