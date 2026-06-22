export interface SettingsProfileSelection {
  profileId: string;
  manualConfigDir: string;
}

export interface SettingsProfileSelectionPayload {
  profileId?: string;
  manualConfigDir?: string;
}

export function getSettingsManualConfigDir({
  selection,
  fields,
}: {
  selection: SettingsProfileSelection;
  fields: Record<string, string>;
}): string {
  return selection.manualConfigDir || fields["CLAUDE_CONFIG_DIR"] || "";
}

export function getSettingsProfileSelectionKey({
  selection,
  fields,
}: {
  selection: SettingsProfileSelection;
  fields: Record<string, string>;
}): string {
  if (selection.profileId === "manual") {
    return `manual:${getSettingsManualConfigDir({ selection, fields })}`;
  }

  return `profile:${selection.profileId}`;
}

export function buildSettingsProfileSelectionPayload({
  selection,
  fields,
  fallbackProfileId,
}: {
  selection: SettingsProfileSelection;
  fields: Record<string, string>;
  fallbackProfileId?: string;
}): SettingsProfileSelectionPayload {
  if (selection.profileId === "manual") {
    return {
      manualConfigDir: getSettingsManualConfigDir({ selection, fields }),
    };
  }

  return {
    profileId: selection.profileId || fallbackProfileId,
  };
}

export function isSettingsProfileActionDisabled({
  selection,
  fields,
}: {
  selection: SettingsProfileSelection;
  fields: Record<string, string>;
}): boolean {
  return (
    selection.profileId === "manual" &&
    getSettingsManualConfigDir({ selection, fields }).trim().length === 0
  );
}
