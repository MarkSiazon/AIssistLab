export interface SettingsExtraFieldRow {
  index: number;
  key: string;
  value: string;
  keyInputId: string;
  valueInputId: string;
  removeLabel: string;
}

export function getSettingsExtraFieldRows({
  extraFields,
}: {
  extraFields: Record<string, string>;
}): SettingsExtraFieldRow[] {
  return Object.entries(extraFields).map(([key, value], index) => ({
    index,
    key,
    value,
    keyInputId: `settings-extra-key-${index}`,
    valueInputId: `settings-extra-value-${index}`,
    removeLabel: `Remove additional variable ${key || index + 1}`,
  }));
}
