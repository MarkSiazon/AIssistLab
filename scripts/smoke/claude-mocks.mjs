export function buildMockClaudeCliStatusPayload(
  lastCliSmokeTest = null,
  {
    provider = "anthropic_api",
    enabled = false,
    version = "smoke",
    displayPath = "~/.claude",
    selectedProfileFingerprint = "smoke-default-profile",
  } = {},
) {
  const selectedProfile = {
    id: "default",
    label: "Default profile",
    source: "default",
    displayPath,
    selected: true,
    exists: true,
    auth: {
      checked: true,
      loggedIn: true,
      method: "Subscription",
      error: null,
    },
  };

  return {
    provider,
    enabled,
    cliPath: "claude",
    configuredCliPath: "auto",
    cliPathSource: "path",
    loginCommand: "claude auth login",
    loginCommandSource: "path",
    loginHelperAvailable: false,
    canOpenLogin: true,
    configDirConfigured: false,
    installed: true,
    version,
    profiles: [selectedProfile],
    selectedProfile,
    selectedProfileFingerprint,
    lastCliSmokeTest,
    auth: {
      checked: true,
      loggedIn: true,
      method: "Subscription",
      error: null,
    },
  };
}
