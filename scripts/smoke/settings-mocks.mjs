export function buildMockRuntimeStatusPayload({
  provider = "anthropic_api",
  claudeCliEnabled = false,
  configDirConfigured = false,
  source = "runtime",
} = {}) {
  return {
    provider,
    claudeCliEnabled,
    configDirConfigured,
    source,
  };
}

export function buildMockSettingsEnvPayload({
  raw = [
    "WORKSPACE_ROOT=./examples/demo-workspace",
    "SKILLS_DIR=.claude/skills",
    "LLM_PROVIDER=anthropic_api",
    "ENABLE_LOCAL_CLAUDE_CLI=false",
    "CLAUDE_CLI_PATH=auto",
    "CLAUDE_LOGIN_COMMAND=auto",
    "CLAUDE_CONFIG_DIR=",
    "ANTHROPIC_API_KEY=",
    "",
  ].join("\n"),
  parsed = {
    WORKSPACE_ROOT: "./examples/demo-workspace",
    SKILLS_DIR: ".claude/skills",
    LLM_PROVIDER: "anthropic_api",
    ENABLE_LOCAL_CLAUDE_CLI: "false",
    CLAUDE_CLI_PATH: "auto",
    CLAUDE_LOGIN_COMMAND: "auto",
    CLAUDE_CONFIG_DIR: "",
    ANTHROPIC_API_KEY: "",
  },
  path = ".env.local",
  runtimeApplied = true,
  includePath = true,
  includeRuntimeApplied = true,
  activeRuntime = buildMockRuntimeStatusPayload(),
} = {}) {
  return {
    raw,
    parsed,
    ...(includePath ? { path } : {}),
    ...(includeRuntimeApplied ? { runtimeApplied } : {}),
    activeRuntime,
  };
}

export function buildMockDoctorReportPayload() {
  const checks = [
    {
      id: "workspace-root",
      group: "workspace",
      title: "Workspace path",
      status: "ok",
      severity: "optional",
      message: "Workspace path is valid.",
      suggestedFix: "No action needed.",
      relatedEnvKeys: ["WORKSPACE_ROOT"],
    },
    {
      id: "skills-dir",
      group: "workspace",
      title: "Skills directory",
      status: "ok",
      severity: "optional",
      message: "Skills directory is valid.",
      suggestedFix: "No action needed.",
      relatedEnvKeys: ["SKILLS_DIR"],
    },
    {
      id: "anthropic-api-key",
      group: "provider",
      title: "Anthropic API key",
      status: "ok",
      severity: "optional",
      message: "API provider is configured for production smoke.",
      suggestedFix: "No action needed.",
      relatedEnvKeys: ["ANTHROPIC_API_KEY"],
    },
    {
      id: "rag-index-ready",
      group: "rag",
      title: "RAG index",
      status: "ok",
      severity: "optional",
      message: "Index is ready.",
      suggestedFix: "No action needed.",
      relatedEnvKeys: [],
    },
    {
      id: "claude-project-inventory",
      group: "claude-project",
      title: "Claude project inventory",
      status: "ok",
      severity: "optional",
      message: "Claude project inventory is available.",
      suggestedFix: "No action needed.",
      relatedEnvKeys: ["WORKSPACE_ROOT"],
    },
  ];

  return {
    summary: {
      status: "ok",
      readinessScore: 100,
      errorCount: 0,
      warningCount: 0,
      okCount: checks.length,
      topRecommendation: "Setup is ready.",
    },
    checks,
    claudeProject: {
      workspaceDisplay: "./examples/demo-workspace",
      counts: {
        skills: 1,
        commands: 1,
        agents: 1,
        mcpServers: 1,
        hooks: 0,
        pluginFolders: 0,
      },
      checks: [
        {
          id: "claude-project-settings",
          status: "ok",
          title: "Project settings",
          message: "Shared project settings are present.",
        },
      ],
      reloadHints: ["Restart Claude Code after project config changes."],
    },
  };
}
