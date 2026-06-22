"use client";

import type { Dispatch, SetStateAction } from "react";
import { SetupDoctorCheckCard } from "@/components/settings/SetupDoctorCheckCard";
import type { SettingsStatusMessage } from "@/components/settings/SettingsStatusBanner";
import { useSettingsFirstRunActions } from "@/hooks/useSettingsFirstRunActions";
import { useSettingsReleaseActions } from "@/hooks/useSettingsReleaseActions";
import type { PublicIndexState } from "@/lib/rag/index-state";
import type {
  ActiveRuntimeProviderStatus,
  ClaudeCliStatus,
  ClaudeCliTestResult,
  FirstRunChatStatus,
  ReleaseReadinessReport,
} from "@/lib/settings/client-api";
import type {
  SetupDoctorCheck,
  SetupDoctorReport,
} from "@/lib/settings/doctor";
import type { SkillQualityReport } from "@/lib/skills/quality";
import { buildSettingsActiveValueItems } from "@/lib/ui/settings-active-values-panel";
import { DOCTOR_GROUP_LABELS } from "@/lib/ui/settings-doctor-groups";
import { getSettingsFieldDisplayValue } from "@/lib/ui/settings-field-display";
import { KNOWN_FIELDS } from "@/lib/ui/settings-fields";
import { displaySettingsPath } from "@/lib/ui/settings-path-display";
import type { SettingsProfileSelection } from "@/lib/ui/settings-profile-selection";
import {
  doctorStatusColor,
  profileStatusText,
  type SettingsPathState,
} from "@/lib/ui/settings-status";

interface UseSettingsSidePaneControllerInput {
  activeRuntime: ActiveRuntimeProviderStatus | null;
  chatReadiness: FirstRunChatStatus | null;
  claudeActionLoading: boolean;
  claudeStatus: ClaudeCliStatus | null;
  claudeStatusLoading: boolean;
  claudeTestIsCurrent: boolean;
  claudeTestLoading: boolean;
  claudeTestResult: ClaudeCliTestResult | null;
  diagnosticsExported: boolean;
  doctorLoading: boolean;
  doctorReport: SetupDoctorReport | null;
  fields: Record<string, string>;
  indexRebuilding: boolean;
  indexStatus: PublicIndexState | null;
  pathStates: Record<string, SettingsPathState | undefined>;
  profileActionsDisabled: boolean;
  profileSelection: SettingsProfileSelection;
  qualityReport: SkillQualityReport | null;
  releaseReadiness: ReleaseReadinessReport | null;
  saving: boolean;
  settingsPath?: string;
  setDiagnosticsExported: Dispatch<SetStateAction<boolean>>;
  setStatus: Dispatch<SetStateAction<SettingsStatusMessage | null>>;
  openClaudeLogin: () => void;
  rebuildIndexFromSettings: () => void;
  refreshClaudePanel: () => void;
  refreshDoctor: () => void;
  saveCurrentSettings: () => void;
  testClaudeCli: () => void;
}

function renderDoctorCheck(
  item: SetupDoctorCheck,
  options: { showFix?: boolean; showEnvKeys?: boolean } = {},
) {
  return (
    <SetupDoctorCheckCard
      key={item.id}
      check={item}
      showFix={options.showFix}
      showEnvKeys={options.showEnvKeys}
    />
  );
}

export function useSettingsSidePaneController({
  activeRuntime,
  chatReadiness,
  claudeActionLoading,
  claudeStatus,
  claudeStatusLoading,
  claudeTestIsCurrent,
  claudeTestLoading,
  claudeTestResult,
  diagnosticsExported,
  doctorLoading,
  doctorReport,
  fields,
  indexRebuilding,
  indexStatus,
  pathStates,
  profileActionsDisabled,
  profileSelection,
  qualityReport,
  releaseReadiness,
  saving,
  settingsPath,
  setDiagnosticsExported,
  setStatus,
  openClaudeLogin,
  rebuildIndexFromSettings,
  refreshClaudePanel,
  refreshDoctor,
  saveCurrentSettings,
  testClaudeCli,
}: UseSettingsSidePaneControllerInput) {
  const firstRunActions = useSettingsFirstRunActions({
    doctorChecks: doctorReport?.checks ?? [],
    indexStatus,
    runtimeStatus: activeRuntime,
    chatStatus: chatReadiness,
    diagnosticsExported,
    saving,
    indexRebuilding,
    claudeTestLoading,
    claudeCliInstalled: claudeStatus?.installed === true,
    profileActionDisabled: profileActionsDisabled,
    setDiagnosticsExported,
    saveSettings: saveCurrentSettings,
    rebuildIndex: rebuildIndexFromSettings,
    testClaudeCli,
  });
  const releaseActions = useSettingsReleaseActions({
    saving,
    indexRebuilding,
    setStatus,
    saveSettings: saveCurrentSettings,
    rebuildIndex: rebuildIndexFromSettings,
  });
  const activeValueItems = buildSettingsActiveValueItems({
    fields: KNOWN_FIELDS,
    values: fields,
    pathStates,
    displayValueForField: (field, value) =>
      getSettingsFieldDisplayValue({
        field,
        value,
        profileSelection,
        fields,
        claudeStatus,
      }),
  });

  return {
    doctorReport,
    doctorLoading,
    claudeStatus,
    claudeStatusLoading,
    claudeActionLoading,
    claudeTestLoading,
    claudeTestResult,
    claudeTestIsCurrent,
    activeRuntime,
    releaseReadiness,
    indexStatus,
    saving,
    indexRebuilding,
    qualityReport,
    firstRunItems: firstRunActions.items,
    firstRunActionDisabled: firstRunActions.isActionDisabled,
    firstRunActionHint: firstRunActions.getActionHint,
    releaseActionDisabled: releaseActions.isActionDisabled,
    activeValueItems,
    settingsPath,
    groupLabels: DOCTOR_GROUP_LABELS,
    statusColor: doctorStatusColor,
    profileStatusText,
    profileActionDisabled: profileActionsDisabled,
    formatPath: displaySettingsPath,
    renderDoctorCheck,
    onRefresh: refreshDoctor,
    onReleaseAction: releaseActions.runAction,
    onRebuildIndex: rebuildIndexFromSettings,
    onFirstRunAction: firstRunActions.runAction,
    onRefreshClaude: refreshClaudePanel,
    onOpenLogin: openClaudeLogin,
    onTestCli: testClaudeCli,
  };
}
