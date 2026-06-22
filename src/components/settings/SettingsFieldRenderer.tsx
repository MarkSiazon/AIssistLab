import {
  SettingsPasswordFieldControl,
  SettingsPathFieldControl,
  SettingsRelativePathFieldControl,
  SettingsSelectFieldControl,
  SettingsTextFieldControl,
} from "@/components/settings/SettingsFieldControls";
import { ClaudeProfileField } from "@/components/settings/ClaudeProfileField";
import type { ClaudeCliTestResult } from "@/lib/settings/client-api";
import type { SettingsConfigField } from "@/lib/ui/settings-active-values-panel";
import type { SettingsClaudeProfileSummary } from "@/lib/ui/settings-claude-profile-field";
import { settingsFieldId } from "@/lib/ui/settings-field-ids";
import { toRelativeSettingsPath } from "@/lib/ui/settings-field-controls";
import {
  pathStateBadgePresentation,
  type SettingsPathState,
} from "@/lib/ui/settings-status";

export function SettingsPathBadge({
  state,
}: {
  state: SettingsPathState;
}) {
  const badge = pathStateBadgePresentation(state);
  if (!badge) return null;

  return (
    <span className="text-xs ml-1" style={{ color: badge.color }}>
      {badge.text}
    </span>
  );
}

interface SettingsFieldRendererProps {
  field: SettingsConfigField;
  value: string;
  pathState: SettingsPathState;
  workspaceRoot: string;
  visibleSecret: boolean;
  claudeProfiles: SettingsClaudeProfileSummary[];
  selectedClaudeProfile: SettingsClaudeProfileSummary | undefined;
  selectedProfileId: string;
  manualProfilePath: string;
  claudeTestResult: ClaudeCliTestResult | null;
  claudeTestIsCurrent: boolean;
  claudeActionLoading: boolean;
  claudeTestLoading: boolean;
  canOpenClaudeLogin: boolean;
  claudeCliInstalled: boolean;
  profileActionDisabled: boolean;
  onFieldChange: (key: string, value: string) => void;
  onSecretVisibilityToggle: (key: string) => void;
  onSelectProfile: (next: {
    profileId: string;
    manualConfigDir: string;
  }) => void;
  onOpenClaudeLogin: () => void;
  onTestClaudeCli: () => void;
}

export function SettingsFieldRenderer({
  field,
  value,
  pathState,
  workspaceRoot,
  visibleSecret,
  claudeProfiles,
  selectedClaudeProfile,
  selectedProfileId,
  manualProfilePath,
  claudeTestResult,
  claudeTestIsCurrent,
  claudeActionLoading,
  claudeTestLoading,
  canOpenClaudeLogin,
  claudeCliInstalled,
  profileActionDisabled,
  onFieldChange,
  onSecretVisibilityToggle,
  onSelectProfile,
  onOpenClaudeLogin,
  onTestClaudeCli,
}: SettingsFieldRendererProps) {
  const fieldId = settingsFieldId(field.key);
  const hintId = `${fieldId}-hint`;

  if (field.type === "profile") {
    return (
      <ClaudeProfileField
        fieldKey={field.key}
        fieldId={fieldId}
        hintId={hintId}
        profiles={claudeProfiles}
        selectedProfile={selectedClaudeProfile}
        selectedProfileId={selectedProfileId}
        manualPath={manualProfilePath}
        pathState={pathState}
        testResult={claudeTestResult}
        testIsCurrent={claudeTestIsCurrent}
        actionLoading={claudeActionLoading}
        testLoading={claudeTestLoading}
        canOpenLogin={canOpenClaudeLogin}
        cliInstalled={claudeCliInstalled}
        profileActionDisabled={profileActionDisabled}
        renderPathBadge={(state) => <SettingsPathBadge state={state} />}
        onSelectProfile={onSelectProfile}
        onManualPathChange={(path) => onFieldChange(field.key, path)}
        onOpenLogin={onOpenClaudeLogin}
        onTestCli={onTestClaudeCli}
      />
    );
  }

  if (field.type === "path") {
    return (
      <SettingsPathFieldControl
        field={field}
        fieldId={fieldId}
        hintId={hintId}
        value={value}
        pathState={pathState}
        renderPathBadge={(state) => <SettingsPathBadge state={state} />}
        onChange={(path) => onFieldChange(field.key, path)}
      />
    );
  }

  if (field.type === "relpath") {
    return (
      <SettingsRelativePathFieldControl
        field={field}
        fieldId={fieldId}
        hintId={hintId}
        value={value}
        pathState={pathState}
        workspaceRoot={workspaceRoot}
        toRelative={toRelativeSettingsPath}
        renderPathBadge={(state) => <SettingsPathBadge state={state} />}
        onChange={(path) => onFieldChange(field.key, path)}
      />
    );
  }

  if (field.type === "select") {
    return (
      <SettingsSelectFieldControl
        field={field}
        fieldId={fieldId}
        hintId={hintId}
        value={value}
        onChange={(nextValue) => onFieldChange(field.key, nextValue)}
      />
    );
  }

  if (field.type === "password") {
    return (
      <SettingsPasswordFieldControl
        field={field}
        fieldId={fieldId}
        hintId={hintId}
        value={value}
        visible={visibleSecret}
        onChange={(nextValue) => onFieldChange(field.key, nextValue)}
        onToggleVisible={() => onSecretVisibilityToggle(field.key)}
      />
    );
  }

  return (
    <SettingsTextFieldControl
      field={field}
      fieldId={fieldId}
      hintId={hintId}
      value={value}
      onChange={(nextValue) => onFieldChange(field.key, nextValue)}
    />
  );
}
