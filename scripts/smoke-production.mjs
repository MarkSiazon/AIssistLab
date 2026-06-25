import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";
import {
  fetchWithTimeout,
  getFreePort,
  pushLog,
} from "./lib/server-utils.mjs";
import {
  assertVisibleButtonsAccountedFor,
  assertVisibleLinksAccountedFor,
  chatReadinessLinkHrefs,
  markAppRouteLinksCovered,
  markButtonLocatorCovered,
  markVisibleButtonsCoveredByLabel,
  markVisibleLinksCoveredByHref,
} from "./smoke/dom-coverage.mjs";
import { assertNoUnsafe } from "./smoke/privacy-assertions.mjs";
import { assertRouteInteractionState } from "./smoke/interaction-assertions.mjs";
import { assertRouteSemanticState } from "./smoke/semantic-assertions.mjs";
import { assertRouteVisualState } from "./smoke/visual-assertions.mjs";

const root = process.cwd();
const demoWorkspace = path.join(root, "examples", "demo-workspace");
const buildIdPath = path.join(root, ".next", "BUILD_ID");
const routeNavigationTimeoutMs = 60000;
const productionDeviceBlockMessage =
  "Local device access is disabled in production mode.";
const productionCliBlockMessage =
  "Local Claude CLI is disabled in production mode.";

const localDeviceApiChecks = [
  ["/api/chat/status"],
  ["/api/index"],
  ["/api/index", { method: "POST" }],
  ["/api/release/readiness"],
  ["/api/settings"],
  ["/api/settings", { method: "POST", body: "{}" }],
  ["/api/settings/doctor"],
  ["/api/settings/runtime"],
  ["/api/settings/claude-project"],
  ["/api/settings/path-exists?path=."],
  ["/api/settings/browse?path=."],
  ["/api/settings/browse/search?q=demo"],
  ["/api/settings/native-folder"],
  ["/api/skills"],
  ["/api/skills/templates"],
  ["/api/skills/validation"],
  ["/api/skills/browser-smoke-skill"],
  ["/api/skills/import/preview", { method: "POST", body: "{}" }],
  ["/api/skills/import/apply", { method: "POST", body: "{}" }],
  ["/api/export"],
  ["/api/export/zip?diagnostics=true"],
];
const localCliApiChecks = [
  ["/api/settings/claude-cli"],
  ["/api/settings/claude-cli", { method: "POST", body: "{}" }],
  ["/api/settings/claude-cli/profiles"],
  ["/api/settings/claude-cli/test", { method: "POST", body: "{}" }],
];
const pageChecks = [
  ["/", "Library Readiness"],
  ["/settings", "V1 Release Readiness"],
  ["/skills", "Library Readiness"],
  ["/chat", "Chat Readiness"],
  ["/export", "Export Skills"],
  ["/editor", "New Skill"],
  ["/editor/guided", "Guided Skill Builder"],
];
const visualViewports = [
  ["desktop", { width: 1366, height: 920 }],
  ["mobile", { width: 390, height: 844, isMobile: true }],
];

const mockTemplates = [
  {
    id: "reference-skill",
    label: "Reference Skill",
    description: "Capture stable reference material with clear lookup guidance.",
    category: "reference",
    initialFrontmatter: {
      description: "Reference facts and examples for a focused topic.",
      tags: ["reference"],
    },
    initialBody: [
      "## Purpose",
      "",
      "Use this skill when the user needs reliable reference material.",
      "",
    ].join("\n"),
  },
  {
    id: "workflow-skill",
    label: "Workflow Skill",
    description: "Guide a repeated task from intake through verification.",
    category: "workflow",
    initialFrontmatter: {
      description: "Step-by-step workflow for completing a repeated task.",
      tags: ["workflow"],
    },
    initialBody: [
      "## Intake",
      "",
      "- Confirm the target files and expected output.",
      "",
      "## Verification",
      "",
      "- Run the documented checks.",
      "",
    ].join("\n"),
  },
  {
    id: "learning-rubric",
    label: "Learning And Rubric Skill",
    description: "Coach a user through learning with prompts and rubric feedback.",
    category: "learning",
    initialFrontmatter: {
      description: "Guide learning through prompts and rubric feedback.",
      tags: ["learning", "rubric"],
    },
    initialBody: "## Learning Goal\n\nCoach the user through the concept.\n",
  },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function exists(filePath) {
  return Boolean(await stat(filePath).catch(() => null));
}

async function waitForServer(baseUrl, child, logs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 90000) {
    if (child.exitCode !== null) {
      throw new Error(`Next production server exited early.\n${logs.join("\n")}`);
    }
    try {
      const response = await fetchWithTimeout(`${baseUrl}/`, {
        headers: { host: new URL(baseUrl).host },
      }, 2000);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await delay(1000);
  }
  throw new Error(`Timed out waiting for Next production server.\n${logs.join("\n")}`);
}

async function expectForbiddenLocalApi(
  baseUrl,
  pathName,
  expectedMessage,
  init = {},
) {
  const response = await fetchWithTimeout(`${baseUrl}${pathName}`, {
    ...init,
    headers: {
      host: new URL(baseUrl).host,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  assert(response.status === 403, `${pathName} should be production-guarded.`);
  const serializedPayload = JSON.stringify(payload);
  assert(
    serializedPayload.includes(expectedMessage),
    `${pathName} should explain that local device access is disabled in production.`,
  );
  assertNoUnsafe(`${pathName} forbidden response`, serializedPayload);
}

async function expectProductionChatMissingKeyStream(baseUrl) {
  const response = await fetchWithTimeout(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: {
      host: new URL(baseUrl).host,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: "Summarize release readiness from the indexed demo skills.",
    }),
  });
  const body = await response.text();

  assert(response.status === 200, "/api/chat should return a stream response.");
  assert(
    /text\/event-stream/.test(response.headers.get("content-type") ?? ""),
    "/api/chat should return an event-stream content type.",
  );
  assert(/"type":"citations"/.test(body), "/api/chat should stream citations first.");
  assert(
    /"type":"error"/.test(body),
    "/api/chat should stream a provider error when API key is missing.",
  );
  assert(
    /ANTHROPIC_API_KEY is not configured/.test(body),
    "/api/chat missing-key error should be actionable.",
  );
  assertNoUnsafe("/api/chat missing-key stream", body);
}

async function runApiSmoke(baseUrl) {
  for (const [pathName, init] of localDeviceApiChecks) {
    await expectForbiddenLocalApi(
      baseUrl,
      pathName,
      productionDeviceBlockMessage,
      init,
    );
  }

  for (const [pathName, init] of localCliApiChecks) {
    await expectForbiddenLocalApi(
      baseUrl,
      pathName,
      productionCliBlockMessage,
      init,
    );
  }

  await expectProductionChatMissingKeyStream(baseUrl);
}

async function expectPageText(page, baseUrl, route, text, viewportLabel = "desktop") {
  await page.goto(`${baseUrl}${route}`, {
    waitUntil: "networkidle",
    timeout: routeNavigationTimeoutMs,
  });
  await page.getByText(text, { exact: false }).first().waitFor({
    state: "visible",
    timeout: routeNavigationTimeoutMs,
  });
  await assertRouteVisualState(page, `${viewportLabel} ${route}`);
  await assertRouteSemanticState(page, `${viewportLabel} ${route}`);
  await assertRouteInteractionState(page, `${viewportLabel} ${route}`);
}

async function expectText(page, text, label = text) {
  await page.getByText(text, { exact: false }).first().waitFor({
    state: "visible",
    timeout: routeNavigationTimeoutMs,
  });
  assert(Boolean(label), "Expected text label must be non-empty");
}

async function expectTextHidden(page, text) {
  await page.getByText(text, { exact: false }).first().waitFor({
    state: "hidden",
    timeout: routeNavigationTimeoutMs,
  });
}

async function clickButton(page, name) {
  const button = page.getByRole("button", { name }).first();
  await button.waitFor({ state: "visible", timeout: routeNavigationTimeoutMs });
  assert(!(await button.isDisabled()), `Button is disabled: ${name}`);
  await markButtonLocatorCovered(button);
  await button.click();
}

async function waitForRecordedUrl(page, readLatestUrl, label) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < routeNavigationTimeoutMs) {
    const url = readLatestUrl();
    if (url) return url;
    await page.waitForTimeout(100);
  }

  throw new Error(`${label} was not requested. Current URL: ${page.url()}`);
}

async function assertCurrentRouteState(page, scope) {
  await assertRouteSemanticState(page, scope);
  await assertRouteInteractionState(page, scope);
}

async function markChatReadinessLinksCovered(locator) {
  await markVisibleLinksCoveredByHref(locator, chatReadinessLinkHrefs, {
    requireAll: false,
  });
}

async function assertCurrentRouteDomCoverage(page, scope, options = {}) {
  const {
    buttonLabels = [],
    linkLabels = [],
    linkHrefs = [],
    includeChatReadinessLinks = true,
  } = options;

  if (buttonLabels.length > 0) {
    await markVisibleButtonsCoveredByLabel(page, buttonLabels, {
      requireAll: false,
    });
  }
  await markAppRouteLinksCovered(page, linkLabels);
  if (linkHrefs.length > 0) {
    await markVisibleLinksCoveredByHref(page, linkHrefs, { requireAll: false });
  }
  if (includeChatReadinessLinks) await markChatReadinessLinksCovered(page);
  await assertVisibleButtonsAccountedFor(page, scope);
  await assertVisibleLinksAccountedFor(page, scope);
}

function attachBrowserIssueTracking(page, browserIssues) {
  page.on("pageerror", (error) => {
    browserIssues.push(`pageerror: ${error.stack || error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      if (/Failed to load resource: .*status of 403/.test(text)) return;
      browserIssues.push(`console: ${text}`);
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 500) {
      browserIssues.push(`http ${response.status()}: ${response.url()}`);
    }
  });
}

function mockChatStatusPayload() {
  return {
    provider: "anthropic_api",
    runtimeSource: "runtime",
    canSend: true,
    blockingReason: null,
    suggestedAction: null,
    claudeCliEnabled: false,
    suggestedQuestions: ["What should I test in production smoke?"],
    index: {
      status: "ready",
      skillCount: 1,
      chunkCount: 2,
      staleReason: null,
      error: null,
    },
    lastCliSmokeTest: null,
  };
}

function mockSettingsEnvPayload() {
  const raw = [
    "WORKSPACE_ROOT=./examples/demo-workspace",
    "SKILLS_DIR=.claude/skills",
    "LLM_PROVIDER=anthropic_api",
    "ENABLE_LOCAL_CLAUDE_CLI=false",
    "CLAUDE_CLI_PATH=auto",
    "CLAUDE_LOGIN_COMMAND=auto",
    "CLAUDE_CONFIG_DIR=",
    "ANTHROPIC_API_KEY=",
    "",
  ].join("\n");

  return {
    raw,
    parsed: {
      WORKSPACE_ROOT: "./examples/demo-workspace",
      SKILLS_DIR: ".claude/skills",
      LLM_PROVIDER: "anthropic_api",
      ENABLE_LOCAL_CLAUDE_CLI: "false",
      CLAUDE_CLI_PATH: "auto",
      CLAUDE_LOGIN_COMMAND: "auto",
      CLAUDE_CONFIG_DIR: "",
      ANTHROPIC_API_KEY: "",
    },
    path: ".env.local",
    runtimeApplied: true,
    activeRuntime: mockRuntimeStatusPayload(),
  };
}

function mockRuntimeStatusPayload() {
  return {
    provider: "anthropic_api",
    claudeCliEnabled: false,
    configDirConfigured: false,
    source: "runtime",
  };
}

function mockIndexStatusPayload() {
  return {
    status: "ready",
    built: true,
    builtAt: "2026-06-12T04:00:00.000Z",
    skillCount: 1,
    chunkCount: 2,
    staleReason: null,
    workspaceDisplay: "./examples/demo-workspace",
    skillsDirDisplay: ".claude/skills",
    error: null,
  };
}

function mockSkillQualityPayload() {
  return {
    totalSkills: 1,
    issueCount: 0,
    issues: [],
  };
}

function mockDoctorReportPayload() {
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

function mockClaudeCliStatusPayload(lastCliSmokeTest = null) {
  const selectedProfile = {
    id: "default",
    label: "Default profile",
    source: "default",
    displayPath: "~/.claude",
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
    provider: "anthropic_api",
    enabled: false,
    cliPath: "claude",
    configuredCliPath: "auto",
    cliPathSource: "path",
    loginCommand: "claude auth login",
    loginCommandSource: "path",
    loginHelperAvailable: false,
    canOpenLogin: true,
    configDirConfigured: false,
    installed: true,
    version: "production-smoke",
    profiles: [selectedProfile],
    selectedProfile,
    selectedProfileFingerprint: "production-smoke-default-profile",
    lastCliSmokeTest,
    auth: {
      checked: true,
      loggedIn: true,
      method: "Subscription",
      error: null,
    },
  };
}

function mockExportSkillsPayload() {
  return {
    skills: [
      {
        name: "release-readiness-smoke",
        description: "Production smoke export fixture.",
        tags: ["smoke", "release"],
        updatedAt: "2026-06-12T04:00:00.000Z",
      },
    ],
  };
}

function mockReleaseReadinessPayload() {
  return {
    schemaVersion: 1,
    generatedAt: "2026-06-12T04:00:00.000Z",
    summary: {
      status: "ready",
      score: 100,
      topAction: null,
      canChat: true,
      canExportDiagnostics: true,
    },
    sections: [
      {
        id: "workspace",
        label: "Workspace",
        status: "ready",
        message: "Workspace path is valid.",
        actionLabel: "Open Settings",
        actionHref: "/settings",
      },
      {
        id: "diagnostics",
        label: "Diagnostics",
        status: "ready",
        message: "Diagnostics export is available.",
        actionLabel: "Export Diagnostics",
        actionHref: "/export?diagnostics=true",
      },
    ],
  };
}

function mockChatStreamBody() {
  return [
    JSON.stringify({
      type: "citations",
      sources: [
        {
          skillName: "release-readiness-smoke",
          section: "1-8",
          score: 0.91,
          preview: "Production smoke citation preview.",
        },
      ],
    }),
    JSON.stringify({ type: "text", text: "Production mock assistant response." }),
    "",
  ].join("\n");
}

async function withMockedSkillTemplates(page, callback) {
  await page.route("**/api/skills/templates", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ templates: mockTemplates }),
    });
  });

  try {
    await callback();
  } finally {
    await page.unroute("**/api/skills/templates");
  }
}

async function runProductionEditorInteractionSmoke(page, baseUrl) {
  await withMockedSkillTemplates(page, async () => {
    await page.goto(`${baseUrl}/editor`, {
      waitUntil: "networkidle",
      timeout: routeNavigationTimeoutMs,
    });
    await expectText(page, "Template Gallery");
    const editorBody = page.getByLabel("Skill markdown body");
    await editorBody.fill("## Custom Draft\n\nKeep this until the user confirms.");
    await clickButton(page, /Use Workflow Skill template/i);
    await expectText(page, "Apply Workflow Skill template?");
    await assertCurrentRouteState(page, "production editor template confirmation");
    await assertCurrentRouteDomCoverage(page, "production editor template confirmation", {
      buttonLabels: [
        "Retry status",
        "Rebuild Index",
        "Cancel",
        "Reference Skill Capture stable reference material with clear lookup guidance.",
        "Workflow Skill Guide a repeated task from intake through verification.",
        "Learning And Rubric Skill Coach a user through learning with prompts and rubric feedback.",
        "Edit",
        "Keep draft",
        "Apply template",
        "Desktop Editor",
        "Mobile Preview",
        "Save",
      ],
    });
    await clickButton(page, "Keep draft");
    await expectTextHidden(page, "Apply Workflow Skill template?");

    await clickButton(page, /Use Reference Skill template/i);
    await expectText(page, "Apply Reference Skill template?");
    await clickButton(page, "Apply template");
    await editorBody.waitFor({ state: "visible", timeout: routeNavigationTimeoutMs });
    const body = await editorBody.inputValue();
    assert(
      body.includes("## Purpose"),
      "Production editor template apply did not populate the markdown body",
    );
    const previewTab = page.getByRole("tab", { name: "Mobile Preview" }).first();
    await previewTab.waitFor({ state: "visible", timeout: routeNavigationTimeoutMs });
    await previewTab.click();
    await expectText(page, "Use this skill when the user needs reliable reference material.");
    await assertCurrentRouteState(page, "production editor preview tab");
    await assertCurrentRouteDomCoverage(page, "production editor preview tab", {
      buttonLabels: [
        "Retry status",
        "Rebuild Index",
        "Reference Skill Capture stable reference material with clear lookup guidance.",
        "Workflow Skill Guide a repeated task from intake through verification.",
        "Learning And Rubric Skill Coach a user through learning with prompts and rubric feedback.",
        "Edit",
        "Desktop Editor",
        "Mobile Preview",
        "Save",
      ],
    });
  });
}

async function runProductionGuidedInteractionSmoke(page, baseUrl) {
  await withMockedSkillTemplates(page, async () => {
    await page.goto(`${baseUrl}/editor/guided`, {
      waitUntil: "networkidle",
      timeout: routeNavigationTimeoutMs,
    });
    await expectText(page, "Guided Skill Builder");
    const purpose = page.locator("#guided-purpose");
    await purpose.waitFor({ state: "visible", timeout: routeNavigationTimeoutMs });
    await purpose.fill("Temporary production smoke draft.");
    await clickButton(page, "Clear draft");
    await expectText(page, "This clears the guided draft from this browser tab.");
    await assertCurrentRouteState(page, "production guided clear confirmation");
    await assertCurrentRouteDomCoverage(page, "production guided clear confirmation", {
      buttonLabels: [
        "Retry status",
        "Rebuild Index",
        "1 Purpose",
        "2 Examples",
        "3 Boundaries",
        "4 Review",
        "Start",
        "Back",
        "Next",
        "Clear draft",
        "Cancel",
        "Clear draft now",
        "Template selected READY Learning And Rubric Skill",
        "Purpose is concrete READY Task and outcome are named.",
        "Audience named NEEDS DETAIL Describe who will use this skill.",
        "Trigger examples NEEDS DETAIL Add at least one realistic user prompt.",
        "Success criteria NEEDS DETAIL Add at least one measurable quality bar.",
        "Required inputs OPTIONAL List inputs when the skill depends on source material.",
        "Boundaries OPTIONAL Add safety or scope limits for higher-quality drafts.",
        "Rubric feedback NOT RUN Run Review Draft before final editing when possible.",
      ],
    });
    await clickButton(page, "Cancel");
    await expectTextHidden(page, "This clears the guided draft from this browser tab.");
    assert(
      (await purpose.inputValue()) === "Temporary production smoke draft.",
      "Production guided clear cancel did not preserve the draft",
    );
  });
}

async function runProductionChatInteractionSmoke(page, baseUrl) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value) => {
          window.__smokeCopiedText = value;
        },
      },
    });
  });
  await page.route("**/api/chat/status", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(mockChatStatusPayload()),
    });
  });
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      contentType: "text/event-stream",
      body: mockChatStreamBody(),
    });
  });

  try {
    await page.goto(`${baseUrl}/chat`, {
      waitUntil: "networkidle",
      timeout: routeNavigationTimeoutMs,
    });
    await expectText(page, "Ready");
    await page.locator("textarea").fill("Mock production chat request");
    await clickButton(page, "Send");
    await expectText(page, "Production mock assistant response.");
    await clickButton(page, /Show citation preview/i);
    await expectText(page, "Production smoke citation preview.");
    await assertCurrentRouteState(page, "production chat expanded citation");
    await assertCurrentRouteDomCoverage(page, "production chat expanded citation", {
      buttonLabels: [
        "Retry status",
        "Send",
        "Clear",
        "Copy",
        "Copy assistant message",
        "Hide citation preview",
        "Rebuild Index",
      ],
      linkLabels: ["Open source skill"],
    });
    await clickButton(page, /Hide citation preview/i);
    await expectTextHidden(page, "Production smoke citation preview.");
    await assertCurrentRouteState(page, "production chat collapsed citation");
    await assertCurrentRouteDomCoverage(page, "production chat collapsed citation", {
      buttonLabels: [
        "Retry status",
        "Send",
        "Clear",
        "Copy",
        "Copy assistant message",
        "Show citation preview",
        "Rebuild Index",
      ],
    });
    await clickButton(page, "Copy assistant message");
    await expectText(page, "Copied");
    const copiedText = await page.evaluate(() => window.__smokeCopiedText);
    assert(
      copiedText === "Production mock assistant response.",
      "Production chat copy did not write the assistant message text",
    );
  } finally {
    await page.unroute("**/api/chat/status");
    await page.unroute("**/api/chat");
  }
}

async function runProductionInteractionSmoke(page, baseUrl) {
  await runProductionEditorInteractionSmoke(page, baseUrl);
  await runProductionGuidedInteractionSmoke(page, baseUrl);
  await runProductionChatInteractionSmoke(page, baseUrl);
}

async function runProductionSettingsInteractionSmoke(page, baseUrl) {
  let settingsSaveCount = 0;
  let indexRebuildCount = 0;
  let cliTestResult = null;

  await page.route("**/api/settings/runtime", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(mockRuntimeStatusPayload()),
    });
  });
  await page.route("**/api/chat/status", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(mockChatStatusPayload()),
    });
  });
  await page.route("**/api/index", async (route) => {
    if (route.request().method() === "POST") indexRebuildCount += 1;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(mockIndexStatusPayload()),
    });
  });
  await page.route("**/api/settings/doctor", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(mockDoctorReportPayload()),
    });
  });
  await page.route("**/api/settings/path-exists**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ exists: true, isDirectory: true }),
    });
  });
  await page.route("**/api/skills/validation", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(mockSkillQualityPayload()),
    });
  });
  await page.route("**/api/release/readiness", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(mockReleaseReadinessPayload()),
    });
  });
  await page.route("**/api/settings/claude-cli**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (pathname === "/api/settings/claude-cli/test") {
      cliTestResult = {
        checked: true,
        ok: true,
        output: "OK",
        error: null,
        provider: "anthropic_api",
        profileId: "default",
        configFingerprint: "production-smoke-default-profile",
      };
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(cliTestResult),
      });
      return;
    }

    if (pathname === "/api/settings/claude-cli" && request.method() === "POST") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ loginCommand: "claude auth login" }),
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(mockClaudeCliStatusPayload(cliTestResult)),
    });
  });
  await page.route("**/api/settings", async (route) => {
    if (route.request().method() === "POST") {
      settingsSaveCount += 1;
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(mockSettingsEnvPayload()),
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(mockSettingsEnvPayload()),
    });
  });

  try {
    await page.goto(`${baseUrl}/settings`, {
      waitUntil: "networkidle",
      timeout: routeNavigationTimeoutMs,
    });
    await expectText(page, "V1 Release Readiness");
    await expectText(page, "First Run Checklist");
    await expectText(page, "Workspace path valid");
    await expectText(page, "Claude/API auth tested");
    await expectText(page, "Manual QA Evidence");
    await assertCurrentRouteState(page, "production settings ready state");
    await assertCurrentRouteDomCoverage(page, "production settings ready state", {
      buttonLabels: [
        "Refresh",
        "Dismiss",
        "Import .env file",
        "Config Fields",
        "Raw .env Editor",
        "Use typed",
        "Choose folder",
        "Browse app",
        "Open Login",
        "Test CLI",
        "Save Provider",
        "Save Current",
        "Show",
        "+ Add",
        "Open Export",
        "Export Diagnostics",
        "Export",
        "Rebuild Index",
        "Save",
        "Open Chat",
        "Mark Passed",
        "Needs Fix",
        "Reset",
      ],
      linkLabels: ["Open Settings"],
    });

    await clickButton(page, "Refresh");
    await expectText(page, "Setup is ready.");
    await assertCurrentRouteState(page, "production settings refreshed state");
    await assertCurrentRouteDomCoverage(page, "production settings refreshed state", {
      buttonLabels: [
        "Refresh",
        "Dismiss",
        "Import .env file",
        "Config Fields",
        "Raw .env Editor",
        "Use typed",
        "Choose folder",
        "Browse app",
        "Open Login",
        "Test CLI",
        "Save Provider",
        "Save Current",
        "Show",
        "+ Add",
        "Open Export",
        "Export Diagnostics",
        "Export",
        "Rebuild Index",
        "Save",
        "Open Chat",
        "Mark Passed",
        "Needs Fix",
        "Reset",
      ],
      linkLabels: ["Open Settings"],
    });

    const manualQaPanel = page.locator(".settings-manual-qa-panel").first();
    await manualQaPanel.waitFor({
      state: "visible",
      timeout: routeNavigationTimeoutMs,
    });
    await clickButton(manualQaPanel, "Mark Passed");
    await expectText(page, "Passed");
    await clickButton(manualQaPanel, "Needs Fix");
    await expectText(page, "Needs fix");
    await clickButton(manualQaPanel, "Reset");
    await expectText(page, "Pending");

    const ragIndexLabel = page.getByText("RAG Index", { exact: true }).first();
    await ragIndexLabel.waitFor({
      state: "visible",
      timeout: routeNavigationTimeoutMs,
    });
    const ragIndexButton = ragIndexLabel
      .locator(
        "xpath=ancestor::div[.//button[normalize-space()='Rebuild Index']][1]//button[normalize-space()='Rebuild Index']",
      )
      .first();
    await ragIndexButton.waitFor({
      state: "visible",
      timeout: routeNavigationTimeoutMs,
    });
    assert(
      !(await ragIndexButton.isDisabled()),
      "Production settings RAG Index rebuild button is disabled",
    );
    await ragIndexButton.click();
    await waitForRecordedUrl(
      page,
      () => (indexRebuildCount > 0 ? "index rebuilt" : ""),
      "Production settings rebuild index action",
    );
    await expectText(page, "Index ready: 1 skills, 2 chunks.");

    await clickButton(page, /^Save settings( changes)?$/i);
    await waitForRecordedUrl(
      page,
      () => (settingsSaveCount > 0 ? "settings saved" : ""),
      "Production settings save action",
    );
    await expectText(page, "Saved and applied to this server session.");
    await assertCurrentRouteState(page, "production settings saved state");
    await assertCurrentRouteDomCoverage(page, "production settings saved state", {
      buttonLabels: [
        "Refresh",
        "Dismiss",
        "Import .env file",
        "Config Fields",
        "Raw .env Editor",
        "Use typed",
        "Choose folder",
        "Browse app",
        "Open Login",
        "Test CLI",
        "Save Provider",
        "Save Current",
        "Show",
        "+ Add",
        "Open Export",
        "Export Diagnostics",
        "Export",
        "Rebuild Index",
        "Save",
        "Open Chat",
        "Mark Passed",
        "Needs Fix",
        "Reset",
      ],
      linkLabels: ["Open Settings"],
    });
  } finally {
    await page.unroute("**/api/settings/runtime");
    await page.unroute("**/api/chat/status");
    await page.unroute("**/api/index");
    await page.unroute("**/api/settings/doctor");
    await page.unroute("**/api/settings/path-exists**");
    await page.unroute("**/api/skills/validation");
    await page.unroute("**/api/release/readiness");
    await page.unroute("**/api/settings/claude-cli**");
    await page.unroute("**/api/settings");
  }
}

async function runProductionExportInteractionSmoke(page, baseUrl) {
  const requestedZipUrls = [];
  const requestedSkillUrls = [];
  await page.route("**/api/skills", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(mockExportSkillsPayload()),
    });
  });
  await page.route("**/api/release/readiness", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(mockReleaseReadinessPayload()),
    });
  });
  await page.route("**/api/export/zip**", async (route) => {
    requestedZipUrls.push(route.request().url());
    await route.fulfill({
      contentType: "application/zip",
      headers: {
        "content-disposition": 'attachment; filename="production-smoke.zip"',
      },
      body: "production smoke zip",
    });
  });
  await page.route("**/api/export?**", async (route) => {
    requestedSkillUrls.push(route.request().url());
    await route.fulfill({
      contentType: "text/markdown",
      headers: {
        "content-disposition":
          'attachment; filename="release-readiness-smoke.md"',
      },
      body: "# Production Smoke Skill\n",
    });
  });

  try {
    await page.goto(`${baseUrl}/export`, {
      waitUntil: "networkidle",
      timeout: routeNavigationTimeoutMs,
    });
    await expectText(page, "Diagnostics export is available.");
    await expectText(page, "release-readiness-smoke.md");
    await expectText(page, "0 of 1 selected");
    await clickButton(page, "Select all");
    await expectText(page, "1 of 1 selected");
    await assertCurrentRouteState(page, "production export selected skill");
    await assertCurrentRouteDomCoverage(page, "production export selected skill", {
      buttonLabels: [
        "Retry status",
        "Rebuild Index",
        "Select all",
        "Clear",
        "Download All + Diagnostics",
        "Export Diagnostics",
        "Download Selected + Diagnostics (1)",
        "Download .md",
        "Download 1 selected skills with diagnostics",
        "Download release-readiness-smoke as Markdown",
      ],
      linkLabels: ["Review Settings"],
    });
    await clickButton(page, "Clear");
    await expectText(page, "0 of 1 selected");

    const skillCheckbox = page
      .getByRole("checkbox", { name: "Select release-readiness-smoke for export" })
      .first();
    await skillCheckbox.waitFor({
      state: "visible",
      timeout: routeNavigationTimeoutMs,
    });
    await skillCheckbox.check();
    await expectText(page, "1 of 1 selected");
    const includeDiagnostics = page
      .getByRole("checkbox", { name: "Include diagnostics in export bundle" })
      .first();
    assert(
      await includeDiagnostics.isChecked(),
      "Production export diagnostics toggle should default to checked",
    );

    await clickButton(page, "Download 1 selected skills with diagnostics");
    const selectedZipUrl = await waitForRecordedUrl(
      page,
      () => requestedZipUrls.at(-1),
      "Production export selected ZIP URL",
    );
    assert(
      selectedZipUrl.includes("skill=release-readiness-smoke") &&
        selectedZipUrl.includes("diagnostics=true"),
      `Production export selected ZIP URL was wrong: ${selectedZipUrl}`,
    );

    await page.goto(`${baseUrl}/export`, {
      waitUntil: "networkidle",
      timeout: routeNavigationTimeoutMs,
    });
    await clickButton(page, "Download release-readiness-smoke as Markdown");
    const skillUrl = await waitForRecordedUrl(
      page,
      () => requestedSkillUrls.at(-1),
      "Production export single-skill URL",
    );
    assert(
      skillUrl.includes("skill=release-readiness-smoke"),
      `Production export single-skill URL was wrong: ${skillUrl}`,
    );
  } finally {
    await page.unroute("**/api/skills");
    await page.unroute("**/api/release/readiness");
    await page.unroute("**/api/export/zip**");
    await page.unroute("**/api/export?**");
  }
}

async function runBrowserSmoke(baseUrl) {
  const browser = await chromium.launch({
    headless: process.env.SMOKE_HEADLESS !== "false",
  });
  try {
    for (const [viewportLabel, viewport] of visualViewports) {
      const page = await browser.newPage({ viewport });
      page.setDefaultNavigationTimeout(routeNavigationTimeoutMs);
      page.setDefaultTimeout(routeNavigationTimeoutMs);
      const browserIssues = [];
      attachBrowserIssueTracking(page, browserIssues);

      try {
        for (const [route, text] of pageChecks) {
          await expectPageText(page, baseUrl, route, text, viewportLabel);
        }
        if (viewportLabel === "desktop") {
          await runProductionInteractionSmoke(page, baseUrl);
          await runProductionSettingsInteractionSmoke(page, baseUrl);
          await runProductionExportInteractionSmoke(page, baseUrl);
        }
        assert(
          browserIssues.length === 0,
          `Production browser issues (${viewportLabel}):\n${browserIssues.join(
            "\n",
          )}`,
        );
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  assert(await exists(buildIdPath), "Production build missing. Run npm run build first.");
  assert(await exists(demoWorkspace), "examples/demo-workspace was not found.");

  const port = Number(process.env.SMOKE_PORT) || (await getFreePort());
  const baseUrl = `http://127.0.0.1:${port}`;
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  const logs = [];
  const child = spawn(
    process.execPath,
    [nextBin, "start", "-H", "127.0.0.1", "-p", String(port)],
    {
      cwd: root,
      env: {
        ...process.env,
        WORKSPACE_ROOT: demoWorkspace,
        SKILLS_DIR: ".claude/skills",
        NEXT_PUBLIC_APP_TITLE: "Skill Workshop RAG",
        LLM_PROVIDER: "anthropic_api",
        ENABLE_LOCAL_CLAUDE_CLI: "false",
        CLAUDE_CLI_PATH: "auto",
        CLAUDE_LOGIN_COMMAND: "auto",
        CLAUDE_CONFIG_DIR: "",
        ANTHROPIC_API_KEY: "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stdout.on("data", (chunk) => pushLog(logs, chunk));
  child.stderr.on("data", (chunk) => pushLog(logs, chunk));

  try {
    await waitForServer(baseUrl, child, logs);
    await runApiSmoke(baseUrl);
    await runBrowserSmoke(baseUrl);
    console.log(`Production smoke passed at ${baseUrl}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    console.error("\nRecent server output:");
    console.error(logs.join("\n"));
    process.exitCode = 1;
  } finally {
    child.kill("SIGTERM");
    await delay(500);
    if (!child.killed && child.exitCode === null) child.kill("SIGKILL");
  }
}

await main();
