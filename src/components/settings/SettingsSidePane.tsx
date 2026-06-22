"use client";

import type { ReactNode } from "react";
import { ActiveValuesPanel } from "@/components/settings/ActiveValuesPanel";
import { ClaudeCliPanel } from "@/components/settings/ClaudeCliPanel";
import { ClaudeProjectInventoryPanel } from "@/components/settings/ClaudeProjectInventoryPanel";
import { FirstRunChecklistPanel } from "@/components/settings/FirstRunChecklistPanel";
import { ManualExternalQaPanel } from "@/components/settings/ManualExternalQaPanel";
import { RagIndexPanel } from "@/components/settings/RagIndexPanel";
import { ReleaseReadinessPanel } from "@/components/settings/ReleaseReadinessPanel";
import { SettingsConfigFilePanel } from "@/components/settings/SettingsConfigFilePanel";
import { SetupDoctorPanel } from "@/components/settings/SetupDoctorPanel";
import { SkillQualityPanel } from "@/components/settings/SkillQualityPanel";
import type {
  ActiveRuntimeProviderStatus,
  ClaudeCliStatus,
  ClaudeCliTestResult,
  ReleaseReadinessReport,
} from "@/lib/settings/client-api";
import type {
  DoctorCheckGroup,
  DoctorCheckStatus,
  SetupDoctorCheck,
  SetupDoctorReport,
} from "@/lib/settings/doctor";
import type { PublicIndexState } from "@/lib/rag/index-state";
import type { SkillQualityReport } from "@/lib/skills/quality";
import type { SettingsActiveValueItem } from "@/lib/ui/settings-active-values-panel";
import type { SettingsClaudeProfileSummary } from "@/lib/ui/settings-claude-panel";
import type {
  FirstRunChecklistAction,
  FirstRunChecklistItem,
} from "@/lib/settings/first-run-checklist";
import type { SettingsReleaseReadinessSection } from "@/lib/ui/settings-release-readiness-panel";

interface SettingsSidePaneProps {
  doctorReport: SetupDoctorReport | null;
  doctorLoading: boolean;
  claudeStatus: ClaudeCliStatus | null;
  claudeStatusLoading: boolean;
  claudeActionLoading: boolean;
  claudeTestLoading: boolean;
  claudeTestResult: ClaudeCliTestResult | null;
  claudeTestIsCurrent: boolean;
  activeRuntime: ActiveRuntimeProviderStatus | null;
  releaseReadiness: ReleaseReadinessReport | null;
  indexStatus: PublicIndexState | null;
  saving: boolean;
  indexRebuilding: boolean;
  qualityReport: SkillQualityReport | null;
  firstRunItems: FirstRunChecklistItem[];
  firstRunActionDisabled: (action: FirstRunChecklistAction) => boolean;
  firstRunActionHint: (action: FirstRunChecklistAction) => string | null;
  releaseActionDisabled: (section: SettingsReleaseReadinessSection) => boolean;
  activeValueItems: SettingsActiveValueItem[];
  settingsPath?: string;
  groupLabels: Record<DoctorCheckGroup, string>;
  statusColor: (status: DoctorCheckStatus) => string;
  profileStatusText: (profile: SettingsClaudeProfileSummary) => string;
  profileActionDisabled: boolean;
  formatPath: (value: string) => string;
  renderDoctorCheck: (
    item: SetupDoctorCheck,
    options?: { showFix?: boolean; showEnvKeys?: boolean },
  ) => ReactNode;
  onRefresh: () => void;
  onReleaseAction: (section: SettingsReleaseReadinessSection) => void;
  onRebuildIndex: () => void;
  onFirstRunAction: (action: FirstRunChecklistAction) => void;
  onRefreshClaude: () => void;
  onOpenLogin: () => void;
  onTestCli: () => void;
}

export function SettingsSidePane({
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
  firstRunItems,
  firstRunActionDisabled,
  firstRunActionHint,
  releaseActionDisabled,
  activeValueItems,
  settingsPath,
  groupLabels,
  statusColor,
  profileStatusText,
  profileActionDisabled,
  formatPath,
  renderDoctorCheck,
  onRefresh,
  onReleaseAction,
  onRebuildIndex,
  onFirstRunAction,
  onRefreshClaude,
  onOpenLogin,
  onTestCli,
}: SettingsSidePaneProps) {
  return (
    <div className="settings-side-pane">
      <div className="settings-side-header">
        <div className="min-w-0">
          <div className="settings-side-title">Setup Center</div>
          <div className="settings-side-subtitle">
            Readiness, project inventory, and local auth checks
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={doctorLoading || claudeStatusLoading}
          className="ui-button ui-button-secondary settings-side-refresh text-xs"
        >
          {doctorLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <ReleaseReadinessPanel
        report={releaseReadiness}
        saving={saving}
        indexRebuilding={indexRebuilding}
        isActionDisabled={releaseActionDisabled}
        onAction={onReleaseAction}
      />

      <ManualExternalQaPanel />

      <ClaudeProjectInventoryPanel
        inventory={doctorReport?.claudeProject ?? null}
        doctorChecks={doctorReport?.checks ?? []}
        doctorLoading={doctorLoading}
        statusColor={statusColor}
        renderDoctorCheck={renderDoctorCheck}
      />

      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <SetupDoctorPanel
          report={doctorReport}
          loading={doctorLoading}
          groupLabels={groupLabels}
          statusColor={statusColor}
          renderDoctorCheck={renderDoctorCheck}
        />
      </div>

      <RagIndexPanel
        indexStatus={indexStatus}
        rebuilding={indexRebuilding}
        onRebuild={onRebuildIndex}
      />

      <SkillQualityPanel qualityReport={qualityReport} />

      <FirstRunChecklistPanel
        items={firstRunItems}
        isActionDisabled={firstRunActionDisabled}
        getActionHint={firstRunActionHint}
        onAction={onFirstRunAction}
      />

      <ClaudeCliPanel
        claudeStatus={claudeStatus}
        activeRuntime={activeRuntime}
        claudeTestResult={claudeTestResult}
        testIsCurrent={claudeTestIsCurrent}
        claudeStatusLoading={claudeStatusLoading}
        claudeActionLoading={claudeActionLoading}
        claudeTestLoading={claudeTestLoading}
        profileActionDisabled={profileActionDisabled}
        formatPath={formatPath}
        profileStatusText={profileStatusText}
        onRefresh={onRefreshClaude}
        onOpenLogin={onOpenLogin}
        onTestCli={onTestCli}
      />

      <ActiveValuesPanel items={activeValueItems} />

      <SettingsConfigFilePanel settingsPath={settingsPath} />
    </div>
  );
}
