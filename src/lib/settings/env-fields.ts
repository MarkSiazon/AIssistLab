export interface SettingsKnownField {
  key: string;
  defaultValue?: string;
}

export interface SplitSettingsEnvFieldsResult {
  fields: Record<string, string>;
  extraFields: Record<string, string>;
}

export interface SettingsSnapshot {
  fields: Record<string, string>;
  extraFields: Record<string, string>;
  rawText: string;
}

function stableSettingsRecord(value: Record<string, string>): string {
  return JSON.stringify(
    Object.entries(value)
      .map(([key, item]) => [key, item ?? ""] as const)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

export function splitSettingsEnvFields({
  parsed,
  knownFields,
}: {
  parsed: Record<string, string>;
  knownFields: readonly SettingsKnownField[];
}): SplitSettingsEnvFieldsResult {
  const fields: Record<string, string> = {};
  const extraFields: Record<string, string> = {};
  const knownKeys = new Set(knownFields.map((field) => field.key));

  for (const [key, value] of Object.entries(parsed)) {
    if (knownKeys.has(key)) fields[key] = value;
    else extraFields[key] = value;
  }

  for (const field of knownFields) {
    if (!fields[field.key] && field.defaultValue) {
      fields[field.key] = field.defaultValue;
    }
  }

  return { fields, extraFields };
}

export function isSettingsSnapshotDirty({
  snapshot,
  fields,
  extraFields,
  rawText,
}: {
  snapshot: SettingsSnapshot | null;
  fields: Record<string, string>;
  extraFields: Record<string, string>;
  rawText: string;
}): boolean {
  if (!snapshot) return false;

  return (
    stableSettingsRecord(fields) !== stableSettingsRecord(snapshot.fields) ||
    stableSettingsRecord(extraFields) !==
      stableSettingsRecord(snapshot.extraFields) ||
    rawText !== snapshot.rawText
  );
}

export function applySettingsFieldValues({
  fields,
  values,
}: {
  fields: Record<string, string>;
  values: Record<string, string>;
}): Record<string, string> {
  return {
    ...fields,
    ...values,
  };
}

export function updateSettingsExtraField({
  extraFields,
  oldKey,
  newKey,
  value,
}: {
  extraFields: Record<string, string>;
  oldKey: string;
  newKey: string;
  value: string;
}): Record<string, string> {
  const next = { ...extraFields };
  delete next[oldKey];
  if (newKey) next[newKey] = value;
  return next;
}

export function removeSettingsExtraField({
  extraFields,
  key,
}: {
  extraFields: Record<string, string>;
  key: string;
}): Record<string, string> {
  const next = { ...extraFields };
  delete next[key];
  return next;
}
