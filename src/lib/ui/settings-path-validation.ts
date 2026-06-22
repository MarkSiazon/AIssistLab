import type { SettingsFieldType } from "@/lib/ui/settings-active-values-panel";
import type { SettingsPathState } from "@/lib/ui/settings-status";

export const SETTINGS_PATH_VALIDATION_DELAY_MS = 500;

export interface SettingsPathValidationResult {
  exists: boolean;
  isDirectory: boolean;
}

export function isSettingsPathValidationFieldType(
  type: SettingsFieldType,
): boolean {
  return type === "path" || type === "profile" || type === "relpath";
}

export function resolveSettingsPathForValidation({
  value,
  type,
  workspaceRoot,
}: {
  value: string;
  type: SettingsFieldType;
  workspaceRoot?: string;
}): string {
  if (type === "relpath" && workspaceRoot) {
    return [
      workspaceRoot.replace(/[\\/]$/, ""),
      value.replace(/^[\\/]/, ""),
    ].join("\\");
  }

  return value;
}

export function settingsPathStateForValidationResult(
  result: SettingsPathValidationResult,
): SettingsPathState {
  return result.exists && result.isDirectory ? "ok" : "error";
}
