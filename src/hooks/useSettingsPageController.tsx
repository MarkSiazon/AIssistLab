"use client";

import { useMemo } from "react";
import { useSettingsClaudeActions } from "@/hooks/useSettingsClaudeActions";
import { useSettingsClaudeDerivedState } from "@/hooks/useSettingsClaudeDerivedState";
import { useSettingsClaudeState } from "@/hooks/useSettingsClaudeState";
import { useSettingsEnvState } from "@/hooks/useSettingsEnvState";
import { useSettingsFieldRenderer } from "@/hooks/useSettingsFieldRenderer";
import { useSettingsIndexAction } from "@/hooks/useSettingsIndexAction";
import { useSettingsPageUiState } from "@/hooks/useSettingsPageUiState";
import { useSettingsPathValidation } from "@/hooks/useSettingsPathValidation";
import { useSettingsPersistenceActions } from "@/hooks/useSettingsPersistenceActions";
import { useSettingsReadinessState } from "@/hooks/useSettingsReadinessState";
import { useSettingsRefreshCoordinator } from "@/hooks/useSettingsRefreshCoordinator";
import { useSettingsSidePaneController } from "@/hooks/useSettingsSidePaneController";
import { useSettingsSkillsDirValidation } from "@/hooks/useSettingsSkillsDirValidation";
import { useSettingsWorkspaceProfileActions } from "@/hooks/useSettingsWorkspaceProfileActions";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";
import {
  CONFIG_SECTIONS,
  KNOWN_FIELDS,
  getDefaultSettingsFieldValues,
} from "@/lib/ui/settings-fields";
import { displaySettingsPath } from "@/lib/ui/settings-path-display";

export function useSettingsPageController() {
  const ui = useSettingsPageUiState();
  const workspace = useWorkspaceProfiles();
  const claude = useSettingsClaudeState();
  const readiness = useSettingsReadinessState();
  const pathValidation = useSettingsPathValidation();
  const defaultFieldValues = useMemo(() => getDefaultSettingsFieldValues(), []);

  const env = useSettingsEnvState({
    knownFields: KNOWN_FIELDS,
    defaultFieldValues,
    validatePath: pathValidation.validatePath,
    onLoadError: ui.handleSettingsLoadError,
  });

  const refresh = useSettingsRefreshCoordinator({
    loadSettings: env.loadSettings,
    loadIndexStatus: readiness.loadIndexStatus,
    loadClaudeStatus: claude.loadClaudeStatus,
    loadDoctorReport: readiness.loadDoctorReport,
    loadRuntimeStatus: readiness.loadRuntimeStatus,
    loadChatReadiness: readiness.loadChatReadiness,
    loadQualityReport: readiness.loadQualityReport,
    loadReleaseReadiness: readiness.loadReleaseReadiness,
  });

  useSettingsSkillsDirValidation({
    workspaceRoot: env.fields["WORKSPACE_ROOT"],
    skillsDir: env.fields["SKILLS_DIR"],
    validatePath: pathValidation.validatePath,
  });

  const claudeActions = useSettingsClaudeActions({
    fields: env.fields,
    refreshActions: refresh.refreshActions,
    buildClaudeProfileSelection: claude.buildClaudeProfileSelection,
    currentProfileSelectionKey: claude.currentProfileSelectionKey,
    setStatus: ui.setStatus,
    setClaudeActionLoading: claude.setClaudeActionLoading,
    setClaudeTestLoading: claude.setClaudeTestLoading,
    setClaudeTestResult: claude.setClaudeTestResult,
    setClaudeTestSelectionKey: claude.setClaudeTestSelectionKey,
  });

  const persistence = useSettingsPersistenceActions({
    tab: ui.tab,
    fields: env.fields,
    extraFields: env.extraFields,
    rawText: env.rawText,
    refreshActions: refresh.refreshActions,
    buildClaudeProfileSelection: claude.buildClaudeProfileSelection,
    setTab: ui.setTab,
    setSaving: ui.setSaving,
    setStatus: ui.setStatus,
    setRawText: env.setRawText,
    setActiveRuntime: readiness.setActiveRuntime,
    markFieldsSaved: env.markFieldsSaved,
    applyRawSaveResult: env.applyRawSaveResult,
  });

  const indexActions = useSettingsIndexAction({
    refreshActions: refresh.refreshActions,
    rebuildIndex: readiness.rebuildIndex,
    setStatus: ui.setStatus,
  });

  const workspaceActions =
    useSettingsWorkspaceProfileActions({
      fields: env.fields,
      workspaceProfileName: workspace.workspaceProfileName,
      applyFieldValues: env.applyFieldValues,
      saveWorkspaceProfileEntry: workspace.saveWorkspaceProfile,
      setStatus: ui.setStatus,
    });

  const claudeDerived = useSettingsClaudeDerivedState({
    fields: env.fields,
    claudeTestResult: claude.claudeTestResult,
    claudeTestSelectionKey: claude.claudeTestSelectionKey,
    currentManualConfigDir: claude.currentManualConfigDir,
    currentProfileSelectionKey: claude.currentProfileSelectionKey,
    profileActionDisabled: claude.profileActionDisabled,
  });

  const { renderField } = useSettingsFieldRenderer({
    fields: env.fields,
    pathStates: pathValidation.pathStates,
    claudeStatus: claude.claudeStatus,
    profileSelection: claude.profileSelection,
    manualProfilePath: claudeDerived.currentManualConfigDir,
    claudeTestResult: claude.claudeTestResult,
    claudeTestIsCurrent: claudeDerived.claudeTestIsCurrent,
    claudeActionLoading: claude.claudeActionLoading,
    claudeTestLoading: claude.claudeTestLoading,
    profileActionsDisabled: claudeDerived.profileActionsDisabled,
    setFieldValue: env.setFieldValue,
    markProfileSelectionChanged: claude.markProfileSelectionChanged,
    openClaudeLogin: claudeActions.openClaudeLogin,
    testClaudeCli: claudeActions.testClaudeCli,
  });

  const sidePaneProps = useSettingsSidePaneController({
    activeRuntime: readiness.activeRuntime,
    chatReadiness: readiness.chatReadiness,
    claudeActionLoading: claude.claudeActionLoading,
    claudeStatus: claude.claudeStatus,
    claudeStatusLoading: claude.claudeStatusLoading,
    claudeTestIsCurrent: claudeDerived.claudeTestIsCurrent,
    claudeTestLoading: claude.claudeTestLoading,
    claudeTestResult: claude.claudeTestResult,
    diagnosticsExported: ui.diagnosticsExported,
    doctorLoading: readiness.doctorLoading,
    doctorReport: readiness.doctorReport,
    fields: env.fields,
    indexRebuilding: readiness.indexRebuilding,
    indexStatus: readiness.indexStatus,
    pathStates: pathValidation.pathStates,
    profileActionsDisabled: claudeDerived.profileActionsDisabled,
    profileSelection: claude.profileSelection,
    qualityReport: readiness.qualityReport,
    releaseReadiness: readiness.releaseReadiness,
    saving: ui.saving,
    settingsPath: env.data?.path,
    setDiagnosticsExported: ui.setDiagnosticsExported,
    setStatus: ui.setStatus,
    openClaudeLogin: claudeActions.openClaudeLogin,
    rebuildIndexFromSettings: indexActions.rebuildIndexFromSettings,
    refreshClaudePanel: refresh.refreshClaudePanel,
    refreshDoctor: refresh.refreshDoctor,
    saveCurrentSettings: persistence.saveCurrentSettings,
    testClaudeCli: claudeActions.testClaudeCli,
  });

  return {
    headerProps: {
      settingsPath: env.data?.path,
      runtimeApplied: readiness.activeRuntime?.source === "runtime",
      settingsDirty: env.settingsDirty,
      saving: ui.saving,
      fileInputRef: ui.fileInputRef,
      onFileImport: persistence.handleFileImport,
      onOpenImport: ui.openFileImport,
      onSave: ui.tab === "fields" ? persistence.saveFields : persistence.saveRaw,
    },
    runtimeNoteProps: {
      settingsDirty: env.settingsDirty,
    },
    statusBannerProps: {
      status: ui.status,
      onDismiss: () => ui.setStatus(null),
    },
    mainPaneProps: {
      tab: ui.tab,
      workspaceProfileName: workspace.workspaceProfileName,
      workspaceProfiles: workspace.workspaceProfiles,
      configSections: CONFIG_SECTIONS,
      pathStates: pathValidation.pathStates,
      extraFields: env.extraFields,
      rawText: env.rawText,
      formatPath: displaySettingsPath,
      renderField,
      onTabChange: ui.setTab,
      onWorkspaceProfileNameChange: workspace.setWorkspaceProfileName,
      onSaveWorkspaceProfile: workspaceActions.saveWorkspaceProfile,
      onApplyWorkspaceProfile: workspaceActions.applyWorkspaceProfile,
      onDeleteWorkspaceProfile: workspace.deleteWorkspaceProfile,
      onAddExtraField: env.addExtraField,
      onUpdateExtraField: env.updateExtraField,
      onRemoveExtraField: env.removeExtraField,
      onRawTextChange: env.setRawText,
      onImportRaw: ui.openFileImport,
    },
    sidePaneProps,
  };
}
