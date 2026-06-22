"use client";

import type { ReactNode } from "react";
import { ConfigFieldsPanel } from "@/components/settings/ConfigFieldsPanel";
import { ExtraFieldsPanel } from "@/components/settings/ExtraFieldsPanel";
import { RawEnvPanel } from "@/components/settings/RawEnvPanel";
import { SettingsPathBadge } from "@/components/settings/SettingsFieldRenderer";
import { SettingsTabs, type SettingsTab } from "@/components/settings/SettingsTabs";
import { WorkspaceProfilesPanel } from "@/components/settings/WorkspaceProfilesPanel";
import type { SettingsConfigField } from "@/lib/ui/settings-active-values-panel";
import type { SettingsConfigSection } from "@/lib/ui/settings-config-fields-panel";
import type { SettingsPathState } from "@/lib/ui/settings-status";
import type { SettingsWorkspaceProfile } from "@/lib/ui/settings-workspace-profiles-panel";

interface SettingsMainPaneProps {
  tab: SettingsTab;
  workspaceProfileName: string;
  workspaceProfiles: SettingsWorkspaceProfile[];
  configSections: readonly SettingsConfigSection[];
  pathStates: Record<string, SettingsPathState | undefined>;
  extraFields: Record<string, string>;
  rawText: string;
  formatPath: (value: string) => string;
  renderField: (field: SettingsConfigField) => ReactNode;
  onTabChange: (tab: SettingsTab) => void;
  onWorkspaceProfileNameChange: (value: string) => void;
  onSaveWorkspaceProfile: () => void;
  onApplyWorkspaceProfile: (profile: SettingsWorkspaceProfile) => void;
  onDeleteWorkspaceProfile: (profileId: string) => void;
  onAddExtraField: () => void;
  onUpdateExtraField: (
    oldKey: string,
    nextKey: string,
    nextValue: string,
  ) => void;
  onRemoveExtraField: (key: string) => void;
  onRawTextChange: (value: string) => void;
  onImportRaw: () => void;
}

export function SettingsMainPane({
  tab,
  workspaceProfileName,
  workspaceProfiles,
  configSections,
  pathStates,
  extraFields,
  rawText,
  formatPath,
  renderField,
  onTabChange,
  onWorkspaceProfileNameChange,
  onSaveWorkspaceProfile,
  onApplyWorkspaceProfile,
  onDeleteWorkspaceProfile,
  onAddExtraField,
  onUpdateExtraField,
  onRemoveExtraField,
  onRawTextChange,
  onImportRaw,
}: SettingsMainPaneProps) {
  return (
    <div className="settings-main-pane">
      <SettingsTabs tab={tab} onTabChange={onTabChange} />

      {tab === "fields" ? (
        <div className="settings-editor-scroll p-6">
          <div className="max-w-2xl flex flex-col gap-6">
            <WorkspaceProfilesPanel
              profileName={workspaceProfileName}
              profiles={workspaceProfiles}
              formatPath={formatPath}
              onProfileNameChange={onWorkspaceProfileNameChange}
              onSaveCurrent={onSaveWorkspaceProfile}
              onApply={onApplyWorkspaceProfile}
              onDelete={onDeleteWorkspaceProfile}
            />

            <ConfigFieldsPanel
              sections={configSections}
              pathStates={pathStates}
              renderField={renderField}
              renderPathBadge={(state) => <SettingsPathBadge state={state} />}
            />

            <ExtraFieldsPanel
              extraFields={extraFields}
              onAdd={onAddExtraField}
              onUpdate={onUpdateExtraField}
              onRemove={onRemoveExtraField}
            />
          </div>
        </div>
      ) : (
        <RawEnvPanel
          rawText={rawText}
          onChange={onRawTextChange}
          onImport={onImportRaw}
        />
      )}
    </div>
  );
}
