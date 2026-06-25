import assert from "node:assert/strict";
import {
  buildSetupDoctorReport,
  type SetupDoctorInput,
} from "./doctor";

const sampleHomePath = ["C:", "Users", "ExampleUser"].join("\\");
const sampleEmail = ["owner", "example.invalid"].join("@");
const sampleApiKey = ["sk", "ant", "secret"].join("-");

const defaultProfile = {
  id: "default",
  label: "Default profile",
  source: "default" as const,
  displayPath: "~\\.claude",
  selected: true,
  exists: true,
  auth: {
    checked: true,
    loggedIn: true,
    method: null,
    error: null,
  },
};

const secondaryProfile = {
  id: "profile-1",
  label: "Profile 1",
  source: "discovered" as const,
  displayPath: "~\\.claude-profiles\\<hidden>",
  selected: false,
  exists: true,
  auth: {
    checked: false,
    loggedIn: null,
    method: null,
    error: null,
  },
};

const baseInput: SetupDoctorInput = {
  env: {
    LLM_PROVIDER: "anthropic_api",
    ENABLE_LOCAL_CLAUDE_CLI: "false",
    CLAUDE_CLI_PATH: "auto",
    CLAUDE_LOGIN_COMMAND: "auto",
    WORKSPACE_ROOT: `${sampleHomePath}\\workspace`,
    SKILLS_DIR: ".claude/skills",
    ANTHROPIC_API_KEY: sampleApiKey,
  },
  paths: {
    workspaceRoot: { exists: true, isDirectory: true },
    skillsDir: { exists: true, isDirectory: true },
  },
  index: {
    status: "ready",
    builtAt: "2026-06-14T00:00:00.000Z",
    skillCount: 3,
    chunkCount: 7,
    staleReason: null,
    error: null,
  },
  claude: {
    provider: "anthropic_api",
    enabled: false,
    cliPath: `${sampleHomePath}\\.local\\bin\\claude.exe`,
    configuredCliPath: "auto",
    cliPathSource: "native-install",
    loginCommand: "claude-login",
    loginCommandSource: "path",
    loginHelperAvailable: true,
    canOpenLogin: true,
    configDirConfigured: false,
    installed: true,
    version: "2.1.175 (Claude Code)",
    profiles: [defaultProfile],
    selectedProfile: defaultProfile,
    selectedProfileFingerprint: "default-fingerprint",
    auth: {
      checked: true,
      loggedIn: true,
      method: null,
      error: null,
    },
  },
  claudeProject: {
    workspaceDisplay: "~\\workspace",
    counts: {
      skills: 1,
      commands: 1,
      agents: 1,
      mcpServers: 1,
      hooks: 1,
      pluginFolders: 0,
    },
    checks: [
      {
        id: "claude-project-settings",
        status: "ok",
        title: "Project settings",
        message: "Shared Claude project settings are present.",
      },
    ],
    reloadHints: ["Restart Claude Code after editing project settings or MCP servers."],
  },
};

function build(overrides: Partial<SetupDoctorInput> = {}) {
  return buildSetupDoctorReport({
    ...baseInput,
    ...overrides,
    env: { ...baseInput.env, ...overrides.env },
    paths: { ...baseInput.paths, ...overrides.paths },
    index: { ...baseInput.index, ...overrides.index },
    claude: { ...baseInput.claude, ...overrides.claude },
  });
}

{
  const report = build();
  const check = report.checks.find((item) => item.id === "rag-index");
  assert.equal(check?.message, "3 skills and 7 chunks indexed.");
}

{
  const report = build({
    paths: { workspaceRoot: { exists: false, isDirectory: false } },
  });
  const check = report.checks.find((item) => item.id === "workspace-root");
  assert.equal(check?.status, "error");
  assert.equal(check?.severity, "blocking");
  assert.equal(report.summary.status, "error");
  assert.equal(report.summary.readinessScore < 100, true);
  assert.match(check?.suggestedFix ?? "", /WORKSPACE_ROOT/);
}

{
  const report = build({
    index: {
      status: "stale",
      staleReason: "Skill files changed after the last index build.",
    },
  } as Partial<SetupDoctorInput>);
  const check = report.checks.find((item) => item.id === "rag-index");
  assert.equal(check?.status, "warn");
  assert.equal(check?.severity, "warning");
  assert.match(check?.message ?? "", /stale/i);
  assert.match(check?.suggestedFix ?? "", /Rebuild Index/i);
}

{
  const report = build({
    index: {
      status: "failed",
      error: `Index failed in ${sampleHomePath}\\secret-oauth-folder`,
    },
  } as Partial<SetupDoctorInput>);
  const check = report.checks.find((item) => item.id === "rag-index");
  assert.equal(check?.status, "error");
  assert.match(check?.message ?? "", /failed/i);
  const raw = JSON.stringify(report);
  assert.doesNotMatch(raw, new RegExp(["C:", "Users"].join("\\\\"), "i"));
  assert.doesNotMatch(raw, /secret-oauth-folder/i);
}

{
  const report = build({
    env: {
      LLM_PROVIDER: "claude_code_cli",
      ENABLE_LOCAL_CLAUDE_CLI: "false",
    },
    claude: {
      provider: "claude_code_cli",
      enabled: false,
    },
  });
  const check = report.checks.find((item) => item.id === "cli-mode-enabled");
  assert.equal(check?.status, "error");
  assert.match(check?.suggestedFix ?? "", /ENABLE_LOCAL_CLAUDE_CLI=true/);
}

{
  const report = build({
    claude: {
      loginHelperAvailable: false,
      canOpenLogin: true,
      auth: {
        checked: true,
        loggedIn: false,
        method: null,
        error:
          `Email: ${sampleEmail} Organization: SecretOrg token ${sampleApiKey} ${sampleHomePath}\\.claude\\config.json`,
      },
    },
  });
  const loginCheck = report.checks.find((item) => item.id === "login-helper");
  assert.equal(loginCheck?.status, "warn");
  const raw = JSON.stringify(report);
  assert.doesNotMatch(raw, new RegExp(sampleEmail.replace(".", "\\.")));
  assert.doesNotMatch(raw, /SecretOrg/);
  assert.doesNotMatch(raw, new RegExp(["sk", "ant"].join("-")));
  assert.doesNotMatch(raw, new RegExp(["C:", "Users"].join("\\\\"), "i"));
}

{
  const report = build({
    env: {
      LLM_PROVIDER: "claude_code_cli",
      ENABLE_LOCAL_CLAUDE_CLI: "true",
      CLAUDE_CONFIG_DIR: "",
    },
    claude: {
      provider: "claude_code_cli",
      enabled: true,
      configDirConfigured: false,
      profiles: [defaultProfile, secondaryProfile],
      selectedProfile: defaultProfile,
    },
  });
  const profileCheck = report.checks.find(
    (item) => item.id === "claude-profile-selection",
  );
  assert.equal(profileCheck?.status, "warn");
  assert.match(profileCheck?.suggestedFix ?? "", /CLAUDE_CONFIG_DIR/);
}

{
  const report = build({
    env: {
      LLM_PROVIDER: "claude_code_cli",
      ENABLE_LOCAL_CLAUDE_CLI: "true",
    },
    claude: {
      provider: "claude_code_cli",
      enabled: true,
    },
    cliTest: {
      checked: false,
      ok: null,
      output: null,
      error: null,
    },
  });
  const e2eCheck = report.checks.find((item) => item.id === "claude-cli-e2e");
  assert.equal(e2eCheck?.status, "warn");
  assert.match(e2eCheck?.message ?? "", /not been run/i);
}

{
  const report = build({
    env: {
      LLM_PROVIDER: "claude_code_cli",
      ENABLE_LOCAL_CLAUDE_CLI: "true",
    },
    claude: {
      provider: "claude_code_cli",
      enabled: true,
    },
    cliTest: {
      checked: true,
      ok: false,
      output: null,
      error: `Email: ${sampleEmail} Organization: SecretOrg ${sampleApiKey} ${sampleHomePath}\\.claude\\oauth.json`,
      provider: "claude_code_cli",
      profileId: "default",
      configFingerprint: "default-fingerprint",
    },
  });
  const e2eCheck = report.checks.find((item) => item.id === "claude-cli-e2e");
  assert.equal(e2eCheck?.status, "error");
  const raw = JSON.stringify(report);
  assert.doesNotMatch(raw, new RegExp(sampleEmail.replace(".", "\\.")));
  assert.doesNotMatch(raw, /SecretOrg/);
  assert.doesNotMatch(raw, new RegExp(["sk", "ant"].join("-")));
  assert.doesNotMatch(raw, new RegExp(["C:", "Users"].join("\\\\"), "i"));
}

{
  const report = build({
    env: {
      LLM_PROVIDER: "claude_code_cli",
      ENABLE_LOCAL_CLAUDE_CLI: "true",
    },
    claude: {
      provider: "claude_code_cli",
      enabled: true,
      selectedProfile: defaultProfile,
    },
    cliTest: {
      checked: true,
      ok: true,
      output: "OK",
      error: null,
      provider: "claude_code_cli",
      profileId: "profile-stale",
      configFingerprint: "stale-fingerprint",
    },
  });
  const e2eCheck = report.checks.find((item) => item.id === "claude-cli-e2e");
  assert.equal(e2eCheck?.status, "warn");
  assert.match(e2eCheck?.message ?? "", /not run for this profile/i);
}

{
  const report = build({
    env: {
      LLM_PROVIDER: "claude_code_cli",
      ENABLE_LOCAL_CLAUDE_CLI: "true",
      CLAUDE_CONFIG_DIR: "~\\.claude-profiles\\<hidden>",
    },
    runtimeEnv: {
      ...process.env,
      LLM_PROVIDER: "anthropic_api",
      ENABLE_LOCAL_CLAUDE_CLI: "false",
      CLAUDE_CONFIG_DIR: "",
      WORKSPACE_ROOT: `${sampleHomePath}\\workspace`,
      SKILLS_DIR: ".claude/skills",
    },
    activeProviderEnv: {
      LLM_PROVIDER: "claude_code_cli",
      ENABLE_LOCAL_CLAUDE_CLI: "true",
      CLAUDE_CLI_PATH: "auto",
      CLAUDE_LOGIN_COMMAND: "auto",
      CLAUDE_CONFIG_DIR: "~\\.claude-profiles\\<hidden>",
      ANTHROPIC_API_KEY: sampleApiKey,
    },
    claude: {
      provider: "claude_code_cli",
      enabled: true,
      configDirConfigured: true,
      selectedProfile: { ...secondaryProfile, selected: true },
    },
  } as Partial<SetupDoctorInput>);
  const syncCheck = report.checks.find((item) => item.id === "runtime-env-sync");
  assert.equal(syncCheck?.status, "ok");
  assert.equal(syncCheck?.severity, "optional");
  assert.doesNotMatch(syncCheck?.message ?? "", /Restart required/i);
}

{
  const report = build({
    env: {
      CLAUDE_CLI_TIMEOUT_MS: "60000",
    },
    runtimeEnv: {
      ...process.env,
      LLM_PROVIDER: "anthropic_api",
      ENABLE_LOCAL_CLAUDE_CLI: "false",
      CLAUDE_CLI_PATH: "auto",
      CLAUDE_LOGIN_COMMAND: "auto",
      CLAUDE_CLI_TIMEOUT_MS: "120000",
      WORKSPACE_ROOT: `${sampleHomePath}\\workspace`,
      SKILLS_DIR: ".claude/skills",
      ANTHROPIC_API_KEY: sampleApiKey,
    },
    activeProviderEnv: {
      LLM_PROVIDER: "anthropic_api",
      ENABLE_LOCAL_CLAUDE_CLI: "false",
      CLAUDE_CLI_PATH: "auto",
      CLAUDE_LOGIN_COMMAND: "auto",
      CLAUDE_CONFIG_DIR: "",
      CLAUDE_CLI_TIMEOUT_MS: "120000",
      ANTHROPIC_API_KEY: sampleApiKey,
    },
  } as Partial<SetupDoctorInput>);
  const syncCheck = report.checks.find((item) => item.id === "runtime-env-sync");
  assert.equal(syncCheck?.status, "warn");
  assert.deepEqual(syncCheck?.relatedEnvKeys, ["CLAUDE_CLI_TIMEOUT_MS"]);
}

{
  const report = build({
    env: {
      WORKSPACE_ROOT: `${sampleHomePath}\\new-workspace`,
    },
    runtimeEnv: {
      ...process.env,
      LLM_PROVIDER: "anthropic_api",
      ENABLE_LOCAL_CLAUDE_CLI: "false",
      WORKSPACE_ROOT: `${sampleHomePath}\\old-workspace`,
      SKILLS_DIR: ".claude/skills",
      ANTHROPIC_API_KEY: sampleApiKey,
    },
    activeProviderEnv: {
      LLM_PROVIDER: "anthropic_api",
      ENABLE_LOCAL_CLAUDE_CLI: "false",
      CLAUDE_CLI_PATH: "auto",
      CLAUDE_LOGIN_COMMAND: "auto",
      ANTHROPIC_API_KEY: sampleApiKey,
    },
  } as Partial<SetupDoctorInput>);
  const syncCheck = report.checks.find((item) => item.id === "runtime-env-sync");
  assert.equal(syncCheck?.status, "warn");
  assert.deepEqual(syncCheck?.relatedEnvKeys, ["WORKSPACE_ROOT"]);
  assert.match(syncCheck?.suggestedFix ?? "", /Restart|rebuild|dev server/i);
}

{
  const report = build({
    claudeProject: {
      workspaceDisplay: "~\\workspace",
      counts: {
        skills: 0,
        commands: 0,
        agents: 1,
        mcpServers: 0,
        hooks: 0,
        pluginFolders: 0,
      },
      checks: [
        {
          id: "claude-agents",
          status: "warn",
          title: "Claude agents",
          message:
            `One project agent is missing required metadata from ${sampleHomePath}\\workspace\\.claude\\agents\\bad.md for ${sampleEmail}.`,
          suggestedFix: "Add name and description frontmatter to project agents.",
        },
      ],
      reloadHints: ["Restart Claude Code after changing agents."],
    },
  } as Partial<SetupDoctorInput>);
  const projectCheck = report.checks.find((item) => item.id === "claude-agents");
  assert.equal(projectCheck?.group, "claude-project");
  assert.equal(projectCheck?.status, "warn");
  assert.match(projectCheck?.suggestedFix ?? "", /frontmatter/i);
  const raw = JSON.stringify(report);
  assert.doesNotMatch(raw, new RegExp(sampleEmail.replace(".", "\\.")));
  assert.doesNotMatch(raw, new RegExp(["C:", "Users"].join("\\\\"), "i"));
}

console.log("Setup Doctor report tests passed");
