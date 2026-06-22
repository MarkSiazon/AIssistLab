export function settingsFieldId(key: string): string {
  return `settings-${key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function settingsManualPathInputId(key: string): string {
  return `${settingsFieldId(key)}-manual-path`;
}
