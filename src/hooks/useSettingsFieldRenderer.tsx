"use client";

import { useCallback, useState } from "react";
import { SettingsFieldRenderer } from "@/components/settings/SettingsFieldRenderer";
import type {
  ClaudeCliStatus,
  ClaudeCliTestResult,
} from "@/lib/settings/client-api";
import type { SettingsConfigField } from "@/lib/ui/settings-active-values-panel";
import type { SettingsPathState } from "@/lib/ui/settings-status";
import type { SettingsProfileSelection } from "@/lib/ui/settings-profile-selection";

interface UseSettingsFieldRendererInput {
  fields: Record<string, string>;
  pathStates: Record<string, SettingsPathState | undefined>;
  claudeStatus: ClaudeCliStatus | null;
  profileSelection: SettingsProfileSelection;
  manualProfilePath: string;
  claudeTestResult: ClaudeCliTestResult | null;
  claudeTestIsCurrent: boolean;
  claudeActionLoading: boolean;
  claudeTestLoading: boolean;
  profileActionsDisabled: boolean;
  setFieldValue: (key: string, value: string) => void;
  markProfileSelectionChanged: (next: SettingsProfileSelection) => void;
  openClaudeLogin: () => void;
  testClaudeCli: () => void;
}

export function useSettingsFieldRenderer({
  fields,
  pathStates,
  claudeStatus,
  profileSelection,
  manualProfilePath,
  claudeTestResult,
  claudeTestIsCurrent,
  claudeActionLoading,
  claudeTestLoading,
  profileActionsDisabled,
  setFieldValue,
  markProfileSelectionChanged,
  openClaudeLogin,
  testClaudeCli,
}: UseSettingsFieldRendererInput) {
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  const renderField = useCallback(
    (field: SettingsConfigField) => (
      <SettingsFieldRenderer
        field={field}
        value={fields[field.key] ?? ""}
        pathState={pathStates[field.key] ?? "idle"}
        workspaceRoot={fields["WORKSPACE_ROOT"] ?? ""}
        visibleSecret={showKey[field.key] ?? false}
        claudeProfiles={claudeStatus?.profiles ?? []}
        selectedClaudeProfile={claudeStatus?.selectedProfile}
        selectedProfileId={profileSelection.profileId}
        manualProfilePath={manualProfilePath}
        claudeTestResult={claudeTestResult}
        claudeTestIsCurrent={claudeTestIsCurrent}
        claudeActionLoading={claudeActionLoading}
        claudeTestLoading={claudeTestLoading}
        canOpenClaudeLogin={claudeStatus?.canOpenLogin ?? false}
        claudeCliInstalled={claudeStatus?.installed ?? false}
        profileActionDisabled={profileActionsDisabled}
        onFieldChange={(key, value) => {
          if (key === "CLAUDE_CONFIG_DIR") {
            markProfileSelectionChanged({
              profileId: "manual",
              manualConfigDir: value,
            });
          }
          setFieldValue(key, value);
        }}
        onSecretVisibilityToggle={(key) =>
          setShowKey((prev) => ({ ...prev, [key]: !prev[key] }))
        }
        onSelectProfile={markProfileSelectionChanged}
        onOpenClaudeLogin={openClaudeLogin}
        onTestClaudeCli={testClaudeCli}
      />
    ),
    [
      claudeActionLoading,
      claudeStatus,
      claudeTestIsCurrent,
      claudeTestLoading,
      claudeTestResult,
      fields,
      markProfileSelectionChanged,
      openClaudeLogin,
      pathStates,
      profileActionsDisabled,
      profileSelection.profileId,
      setFieldValue,
      showKey,
      testClaudeCli,
      manualProfilePath,
    ],
  );

  return { renderField };
}
