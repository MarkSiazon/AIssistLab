import {
  pathStateLabel,
  pathStateTone,
  type SettingsPathState,
  type SettingsTone,
} from "@/lib/ui/settings-status";

export type SettingsFieldType =
  | "password"
  | "path"
  | "profile"
  | "relpath"
  | "text"
  | "select";

export interface SettingsConfigField {
  key: string;
  label: string;
  type: SettingsFieldType;
  placeholder: string;
  hint: string;
  defaultValue?: string;
  options?: readonly { value: string; label: string }[];
}

export interface SettingsActiveValueItem {
  key: string;
  label: string;
  statusLabel: string;
  displayValue: string;
  title: string;
  tone: SettingsTone;
}

function isPathLikeField(field: SettingsConfigField): boolean {
  return (
    field.type === "path" ||
    field.type === "profile" ||
    field.type === "relpath"
  );
}

export function buildSettingsActiveValueItems({
  fields,
  values,
  pathStates,
  displayValueForField,
}: {
  fields: readonly SettingsConfigField[];
  values: Record<string, string | undefined>;
  pathStates: Record<string, SettingsPathState | undefined>;
  displayValueForField: (
    field: SettingsConfigField,
    value: string | undefined,
  ) => string | undefined;
}): SettingsActiveValueItem[] {
  return fields.map((field) => {
    const value = values[field.key];
    const displayValue = displayValueForField(field, value) ?? "";
    const pathLike = isPathLikeField(field);
    const pathState = pathStates[field.key] ?? "idle";

    return {
      key: field.key,
      label: field.label,
      statusLabel: pathLike
        ? pathStateLabel(pathState)
        : displayValue
          ? "Set"
          : "Missing",
      displayValue: displayValue || "(not set)",
      title: displayValue || "(not set)",
      tone: pathLike
        ? pathStateTone(pathState)
        : displayValue
          ? "neutral"
          : "error",
    };
  });
}
