import assert from "node:assert/strict";
import { launchClaudeLogin } from "./claude-cli-actions";
import type {
  ClaudeInternalProfile,
  ClaudeProfileSelectionInput,
  ResolvedClaudeProfileSelection,
} from "@/lib/claude/discovery";
import type {
  ResolvedCliCommand,
  ResolvedLoginCommand,
} from "@/lib/rag/claude-cli-runtime";

type LaunchDependencies = NonNullable<Parameters<typeof launchClaudeLogin>[1]>;

const privateProfilePath = ["C:", "Users", "Example", ".claude-profiles", "work"]
  .join("\\");

const selectedProfile: ClaudeInternalProfile = {
  id: "profile-test",
  label: "Profile 1",
  source: "discovered",
  displayPath: "~\\.claude-profiles\\<hidden>",
  selected: true,
  exists: true,
  auth: {
    checked: false,
    loggedIn: null,
    method: null,
    error: null,
  },
  absoluteConfigDir: privateProfilePath,
  portableConfigDir: "~\\.claude-profiles\\work",
  filesystemPath: privateProfilePath,
};

function resolvedSelection(
  profile = selectedProfile,
): ResolvedClaudeProfileSelection {
  const publicProfile = {
    id: profile.id,
    label: profile.label,
    source: profile.source,
    displayPath: profile.displayPath,
    selected: profile.selected,
    exists: profile.exists,
    auth: profile.auth,
  };

  return {
    profiles: [publicProfile],
    selectedProfile: publicProfile,
    internalProfiles: [profile],
    selectedInternalProfile: profile,
    publicProfile,
    internalProfile: profile,
  };
}

function baseCli(): ResolvedCliCommand {
  return {
    command: "claude",
    displayCommand: "claude",
    configuredCliPath: "auto",
    source: "path",
  };
}

function loginCommand(
  overrides: Partial<ResolvedLoginCommand> = {},
): ResolvedLoginCommand {
  return {
    command: "claude-login",
    displayCommand: "claude-login",
    configuredLoginCommand: "auto",
    source: "path",
    available: true,
    ...overrides,
  };
}

async function main(): Promise<void> {
  const launched: Array<{
    command: string;
    args: string[];
    env?: NodeJS.ProcessEnv;
  }> = [];
  let selectionSeen: ClaudeProfileSelectionInput | undefined;
  let configuredConfigDirSeen: string | null | undefined;
  let cliCommandSeenByLoginResolver: string | null = null;
  let configDirSeenByEnvBuilder: string | null | undefined;

  const helperResult = await launchClaudeLogin(
    { profileId: "profile-test" },
    {
      resolveClaudeCliCommand: async () => baseCli(),
      resolveClaudeLoginCommand: async (claudeCommand) => {
        cliCommandSeenByLoginResolver = claudeCommand;
        return loginCommand();
      },
      resolveClaudeProfileSelection: async (selection, options) => {
        selectionSeen = selection;
        configuredConfigDirSeen = options.configuredConfigDir;
        return resolvedSelection();
      },
      getClaudeConfigDir: () => "~\\.claude-profiles\\configured",
      getClaudeCliEnv: (configDir) => {
        configDirSeenByEnvBuilder = configDir;
        return { CLAUDE_CONFIG_DIR: configDir ?? "" };
      },
      launchVisibleCommand: (command, args, env) => {
        launched.push({ command, args, env });
      },
    } satisfies LaunchDependencies,
  );

  assert.deepEqual(helperResult, {
    ok: true,
    loginCommand: "claude-login",
    mode: "helper",
  });
  assert.equal(cliCommandSeenByLoginResolver, "claude");
  assert.deepEqual(selectionSeen, { profileId: "profile-test" });
  assert.equal(configuredConfigDirSeen, "~\\.claude-profiles\\configured");
  assert.equal(configDirSeenByEnvBuilder, "~\\.claude-profiles\\work");
  assert.deepEqual(launched, [
    {
      command: "claude-login",
      args: [],
      env: { CLAUDE_CONFIG_DIR: "~\\.claude-profiles\\work" },
    },
  ]);

  launched.length = 0;
  const fallbackResult = await launchClaudeLogin(undefined, {
    resolveClaudeCliCommand: async () => ({
      ...baseCli(),
      displayCommand: "Claude Code",
    }),
    resolveClaudeLoginCommand: async () => loginCommand({ available: false }),
    resolveClaudeProfileSelection: async () => resolvedSelection(),
    getClaudeCliEnv: (configDir) => ({ CLAUDE_CONFIG_DIR: configDir ?? "" }),
    commandExists: async () => true,
    launchVisibleCommand: (command, args, env) => {
      launched.push({ command, args, env });
    },
  } satisfies LaunchDependencies);

  assert.deepEqual(fallbackResult, {
    ok: true,
    loginCommand: "Claude Code auth login",
    mode: "claude-auth",
  });
  assert.deepEqual(launched, [
    {
      command: "claude",
      args: ["auth", "login"],
      env: { CLAUDE_CONFIG_DIR: "~\\.claude-profiles\\work" },
    },
  ]);

  launched.length = 0;
  await assert.rejects(
    () =>
      launchClaudeLogin(undefined, {
        resolveClaudeCliCommand: async () => baseCli(),
        resolveClaudeLoginCommand: async () => loginCommand({ available: false }),
        resolveClaudeProfileSelection: async () => resolvedSelection(),
        commandExists: async () => false,
        launchVisibleCommand: (command, args, env) => {
          launched.push({ command, args, env });
        },
      } satisfies LaunchDependencies),
    /Claude login helper was not found, and Claude Code CLI is not installed/i,
  );
  assert.deepEqual(launched, []);

  console.log("Claude CLI action tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
