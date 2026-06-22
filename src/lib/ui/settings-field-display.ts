import type { SettingsConfigField } from "@/lib/ui/settings-active-values-panel";
import { displaySettingsPath } from "@/lib/ui/settings-path-display";
import {
  getSettingsManualConfigDir,
  type SettingsProfileSelection,
} from "@/lib/ui/settings-profile-selection";

interface SettingsFieldDisplayClaudeStatus {
  profiles: Array<{
    id: string;
    displayPath: string;
  }>;
  selectedProfile?: {
    displayPath: string;
  };
}

export function getSettingsFieldDisplayValue({
  field,
  value,
  profileSelection,
  fields,
  claudeStatus,
  formatPath = displaySettingsPath,
}: {
  field: SettingsConfigField;
  value: string | undefined;
  profileSelection: SettingsProfileSelection;
  fields: Record<string, string>;
  claudeStatus?: SettingsFieldDisplayClaudeStatus | null;
  formatPath?: (value: string | undefined) => string;
}): string | undefined {
  if (field.key === "CLAUDE_CONFIG_DIR") {
    if (profileSelection.profileId === "manual") {
      return formatPath(
        getSettingsManualConfigDir({ selection: profileSelection, fields }),
      );
    }

    const profile = claudeStatus?.profiles.find(
      (item) => item.id === profileSelection.profileId,
    );
    return profile?.displayPath ?? claudeStatus?.selectedProfile?.displayPath ?? "";
  }

  if (field.type === "password" && value) {
    return "Configured (hidden)";
  }

  if (
    field.type === "path" ||
    field.type === "relpath" ||
    field.key === "CLAUDE_CLI_PATH" ||
    field.key === "CLAUDE_LOGIN_COMMAND"
  ) {
    return value ? formatPath(value) : value;
  }

  return value;
}
