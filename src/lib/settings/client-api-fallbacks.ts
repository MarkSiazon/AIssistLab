import type {
  ClaudeCliStatus,
  ClaudeProfileSummary,
} from "@/lib/settings/client-api-types";

export function getUnavailableClaudeCliStatus(error: string): ClaudeCliStatus {
  const selectedProfile: ClaudeProfileSummary = {
    id: "default",
    label: "Default profile",
    source: "default",
    displayPath: "~\\.claude",
    selected: true,
    exists: false,
    auth: {
      checked: false,
      loggedIn: null,
      method: null,
      error,
    },
  };

  return {
    provider: "anthropic_api",
    enabled: false,
    cliPath: "auto",
    configuredCliPath: "auto",
    cliPathSource: "path",
    loginCommand: "auto",
    loginCommandSource: "missing",
    loginHelperAvailable: false,
    canOpenLogin: false,
    configDirConfigured: false,
    installed: false,
    version: null,
    profiles: [selectedProfile],
    selectedProfile,
    selectedProfileFingerprint: "unavailable",
    lastCliSmokeTest: null,
    auth: {
      checked: false,
      loggedIn: null,
      method: null,
      error,
    },
  };
}
