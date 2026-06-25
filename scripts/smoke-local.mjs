import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";
import {
  assertVisibleButtonsAccountedFor,
  assertVisibleLinksAccountedFor,
  markButtonLocatorCovered,
  markLinkLocatorCovered,
  markVisibleButtonsCoveredByLabel,
  markVisibleLinksCoveredByHref,
  markVisibleLinksCoveredByLabel,
} from "./smoke/dom-coverage.mjs";
import { assertRouteInteractionState } from "./smoke/interaction-assertions.mjs";
import { assertNoUnsafe } from "./smoke/privacy-assertions.mjs";
import { assertRouteSemanticState } from "./smoke/semantic-assertions.mjs";
import { createZip, extractZipEntries } from "./smoke/zip-utils.mjs";

const root = process.cwd();
const demoWorkspace = path.join(root, "examples", "demo-workspace");
const envLocalPath = path.join(root, ".env.local");
const localWorkspaceRoot = path.join(root, ".local-workspace");
const keepWorkspace = process.env.SMOKE_KEEP_WORKSPACE === "1";
const liveChatMode = process.env.SMOKE_LIVE_CHAT === "1";
const expectedBrowserIssuePatterns = [];
const ignoredBrowserIssuePatterns = [];
const routeNavigationTimeoutMs = 60000;
const appRouteLinkLabels = ["Skills", "RAG Chat", "New Skill", "Export", "Settings"];
const chatReadinessLinkHrefs = [
  "/skills",
  "/chat",
  "/editor",
  "/export",
  "/settings",
  "/export?diagnostics=true",
];

function stamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectBrowserIssue(pattern) {
  expectedBrowserIssuePatterns.push(pattern);
}

function ignoreBrowserIssue(pattern) {
  ignoredBrowserIssuePatterns.push(pattern);
  return () => {
    const index = ignoredBrowserIssuePatterns.indexOf(pattern);
    if (index >= 0) ignoredBrowserIssuePatterns.splice(index, 1);
  };
}

function ignoreKnownNextDevReloadIssues() {
  const stopIgnoring = [
    ignoreBrowserIssue(/http 500: .*\/api\/settings\/path-exists/),
    ignoreBrowserIssue(/http 500: .*\/settings(?:[?#]|$)/),
    ignoreBrowserIssue(
      /console: Failed to load resource: the server responded with a status of 500/,
    ),
    ignoreBrowserIssue(
      /^pageerror: (?:SyntaxError: )?Unexpected end of JSON input(?:\n|$)/,
    ),
    ignoreBrowserIssue(/^pageerror: Error: Manifest file is empty(?:\n|$)/),
  ];

  return () => {
    for (const stop of stopIgnoring) stop();
  };
}

function consumeExpectedBrowserIssue(message) {
  const index = expectedBrowserIssuePatterns.findIndex((pattern) =>
    pattern.test(message),
  );
  if (index >= 0) {
    expectedBrowserIssuePatterns.splice(index, 1);
    return true;
  }

  return ignoredBrowserIssuePatterns.some((pattern) => pattern.test(message));
}

function assertExpectedBrowserIssuesConsumed() {
  assert(
    expectedBrowserIssuePatterns.length === 0,
    `Expected browser issues were not observed: ${expectedBrowserIssuePatterns
      .map((pattern) => pattern.toString())
      .join(" | ")}`,
  );
}

async function assertInteractiveControlsAccessible(page, scope) {
  const semanticPage = typeof page.page === "function" ? page.page() : page;
  await assertRouteSemanticState(semanticPage, scope);
  await assertRouteInteractionState(page, scope);
}

async function assertNoHorizontalPageOverflow(page, scope) {
  const result = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const scrollWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body?.scrollWidth ?? 0,
    );
    const offenders = Array.from(document.querySelectorAll("body *"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0" &&
          rect.width > 0 &&
          rect.height > 0 &&
          (rect.left < -2 || rect.right > viewportWidth + 2)
        );
      })
      .slice(0, 8)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className:
            typeof element.className === "string" ? element.className : "",
          text: (
            element.textContent ||
            element.getAttribute("aria-label") ||
            ""
          )
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 80),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        };
      });
    return { viewportWidth, scrollWidth, offenders };
  });

  assert(
    result.scrollWidth <= result.viewportWidth + 2,
    `${scope} has horizontal overflow: viewport=${result.viewportWidth}, scroll=${result.scrollWidth}, offenders=${JSON.stringify(
      result.offenders,
    )}`,
  );
}

async function waitForButtonHidden(page, label, timeout = 15000) {
  await page
    .getByRole("button", { name: label, exact: true })
    .waitFor({ state: "hidden", timeout });
}

async function waitForEnabledButton(page, label, timeout = 60000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    const button = page.getByRole("button", { name: label, exact: true }).first();
    if (await locatorIsVisibleAndEnabled(button)) {
      return;
    }
    await page.waitForTimeout(250);
  }

  throw new Error(`Button did not become enabled: ${label}`);
}

async function waitForEnabledLocator(locator, label, timeout = 60000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    if (await locatorIsVisibleAndEnabled(locator)) {
      return;
    }
    await locator.page().waitForTimeout(250);
  }

  throw new Error(`${label} did not become enabled`);
}

async function clickEnabledLocator(locator, label, timeout = 60000) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeout) {
    try {
      await waitForEnabledLocator(locator, label, Math.min(5000, timeout));
      await clickButtonLocator(locator, label);
      return;
    } catch (error) {
      lastError = error;
      await locator.page().waitForTimeout(250);
    }
  }

  throw lastError ?? new Error(`${label} could not be clicked while enabled`);
}

async function locatorIsDisabled(locator) {
  const nativeDisabled = await locator
    .isDisabled({ timeout: 1000 })
    .catch(() => false);
  const ariaDisabled = await locator
    .getAttribute("aria-disabled", { timeout: 1000 })
    .catch(() => null);
  return nativeDisabled || ariaDisabled === "true";
}

async function locatorIsVisibleAndEnabled(locator) {
  const count = await locator.count().catch(() => 0);
  if (count <= 0) return false;
  const visible = await locator.isVisible({ timeout: 1000 }).catch(() => false);
  if (!visible) return false;
  return !(await locatorIsDisabled(locator));
}

async function waitForDevRenderingSettled(page, timeout = 30000) {
  await page
    .getByRole("button", { name: "Rendering . . .", exact: true })
    .waitFor({ state: "hidden", timeout })
    .catch(() => undefined);
}

async function waitForApiResponse(page, predicate) {
  const callsite = new Error().stack
    ?.split("\n")
    .slice(2, 6)
    .map((line) => line.trim())
    .join(" | ");
  try {
    return await page.waitForResponse(predicate, { timeout: 60000 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Timed out waiting for API response";
    throw new Error(
      `${message}${callsite ? `\nwaitForApiResponse callsite: ${callsite}` : ""}`,
    );
  }
}

async function settleSidebarIndexState(page) {
  if (page.isClosed()) return;
  const retryStatus = page
    .getByRole("button", { name: "Retry status", exact: true })
    .first();
  if (await locatorIsVisibleAndEnabled(retryStatus)) {
    const clicked = await retryStatus
      .evaluate(
        (button) => {
          button.__smokeCovered = true;
        },
        undefined,
        { timeout: 2000 },
      )
      .then(() => retryStatus.click({ timeout: 2000 }))
      .then(() => true)
      .catch(() => false);
    if (clicked) {
      await page
        .waitForResponse(
          (response) =>
            response.url().includes("/api/index") &&
            response.request().method() === "GET",
          { timeout: 10000 },
        )
        .catch(() => undefined);
    }
  }
  await waitForButtonHidden(page, "Checking...", 15000).catch(() => undefined);
}

async function exists(filePath) {
  return Boolean(await stat(filePath).catch(() => null));
}

async function readOptionalText(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") return null;
    throw error;
  }
}

function smokeEnvPathValue(filePath) {
  return filePath.replace(/\\/g, "/");
}

function buildSmokeEnvLocal(workspacePath) {
  return [
    `WORKSPACE_ROOT=${smokeEnvPathValue(workspacePath)}`,
    "SKILLS_DIR=.claude/skills",
    "NEXT_PUBLIC_APP_TITLE=Skill Workshop RAG",
    "LLM_PROVIDER=anthropic_api",
    "ENABLE_LOCAL_CLAUDE_CLI=false",
    "CLAUDE_CLI_PATH=auto",
    "CLAUDE_LOGIN_COMMAND=auto",
    "CLAUDE_CONFIG_DIR=",
    "ANTHROPIC_API_KEY=",
    "",
  ].join("\n");
}

async function restoreOptionalText(filePath, content) {
  if (content === null) {
    await rm(filePath, { force: true });
    return;
  }
  await writeFile(filePath, content, "utf8");
}

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

function pushLog(lines, chunk) {
  const text = chunk.toString();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    lines.push(line);
  }
  while (lines.length > 80) lines.shift();
}

async function waitForServer(baseUrl, child, logs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 90000) {
    if (child.exitCode !== null) {
      throw new Error(`Next dev server exited early.\n${logs.join("\n")}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/chat/status`, {
        headers: { host: new URL(baseUrl).host },
      });
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await delay(1000);
  }
  throw new Error(`Timed out waiting for Next dev server.\n${logs.join("\n")}`);
}

async function jsonFetch(baseUrl, pathName, init = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    ...init,
    headers: {
      host: new URL(baseUrl).host,
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
  assert(
    response.ok,
    `${init.method ?? "GET"} ${pathName} failed: ${response.status} ${text}`,
  );
  return payload;
}

async function binaryFetch(baseUrl, pathName) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    headers: { host: new URL(baseUrl).host },
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  assert(response.ok, `GET ${pathName} failed: ${response.status}`);
  return buffer;
}

function assertDiagnosticsZipEntries(entries, label) {
  const requiredDiagnostics = [
    "diagnostics/manifest.json",
    "diagnostics/readiness.json",
    "diagnostics/index.json",
    "diagnostics/skill-quality.json",
    "diagnostics/claude-project.json",
    "diagnostics/settings-summary.json",
  ];

  for (const expected of requiredDiagnostics) {
    assert(typeof entries[expected] === "string", `${label} missing ${expected}`);
  }

  const manifest = JSON.parse(entries["diagnostics/manifest.json"]);
  assert(manifest.schemaVersion === 1, `${label} manifest schema mismatch`);
  assert(
    Array.isArray(manifest.diagnostics),
    `${label} manifest diagnostics list missing`,
  );

  const readiness = JSON.parse(entries["diagnostics/readiness.json"]);
  assert(readiness.schemaVersion === 1, `${label} readiness schema mismatch`);
  assert(
    typeof readiness.summary?.status === "string",
    `${label} readiness status missing`,
  );
  assert(
    typeof readiness.summary?.score === "number",
    `${label} readiness score missing`,
  );
  assert(
    Array.isArray(readiness.sections),
    `${label} readiness sections missing`,
  );

  const index = JSON.parse(entries["diagnostics/index.json"]);
  assert(typeof index.status === "string", `${label} index status missing`);

  const skillQuality = JSON.parse(entries["diagnostics/skill-quality.json"]);
  assert(
    typeof skillQuality.totalSkills === "number",
    `${label} skill quality total missing`,
  );
  assert(
    typeof skillQuality.issueCount === "number",
    `${label} skill quality issue count missing`,
  );
  assert(
    Array.isArray(skillQuality.issues),
    `${label} skill quality issues missing`,
  );

  const claudeProject = JSON.parse(entries["diagnostics/claude-project.json"]);
  assert(
    typeof claudeProject.counts === "object" && claudeProject.counts,
    `${label} Claude project counts missing`,
  );

  const settingsSummary = JSON.parse(entries["diagnostics/settings-summary.json"]);
  assert(
    settingsSummary.workspaceRootConfigured === true,
    `${label} settings summary workspace flag missing`,
  );
  assertNoUnsafe(
    `${label} diagnostic content`,
    Object.entries(entries)
      .filter(([name]) => name.startsWith("diagnostics/"))
      .map(([, content]) => content)
      .join("\n"),
  );
}

async function clickButton(page, label, options = {}) {
  const timeout = options.timeout ?? 10000;
  const exact = options.exact !== false;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    const index = await page.locator("button").evaluateAll(
      (buttons, input) => {
        const { labelText, exactMatch } = input;
        const pattern = exactMatch ? null : new RegExp(labelText, "i");
        return buttons.findIndex((button) => {
          const labels = [
            button.innerText,
            button.getAttribute("aria-label"),
            button.getAttribute("title"),
          ]
            .filter(Boolean)
            .map((value) => value.replace(/\s+/g, " ").trim())
            .filter(Boolean);
          const visible = Boolean(
            button.offsetWidth ||
              button.offsetHeight ||
              button.getClientRects().length,
          );
          const disabled =
            button.disabled || button.getAttribute("aria-disabled") === "true";
          if (!visible || disabled) return false;
          return labels.some((text) =>
            exactMatch ? text === labelText : pattern.test(text),
          );
        });
      },
      { labelText: String(label), exactMatch: exact },
    );

    if (index >= 0) {
      const button = page.locator("button").nth(index);
      await markButtonLocatorCovered(button);
      await button.click({ timeout: 15000 });
      return;
    }
    await page.waitForTimeout(250);
  }

  const available = await page.locator("button").evaluateAll((buttons) =>
    buttons
      .flatMap((button) => [
        button.innerText,
        button.getAttribute("aria-label"),
        button.getAttribute("title"),
      ])
      .filter(Boolean)
      .map((value) => value.replace(/\s+/g, " ").trim())
      .filter(Boolean),
  );
  throw new Error(
    `Button not found: ${label}. Available buttons: ${available.join(" | ")}`,
  );
}

async function clickLink(page, label, options = {}) {
  const timeout = options.timeout ?? 10000;
  const exact = options.exact !== false;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    const index = await page.locator("a").evaluateAll(
      (links, input) => {
        const { labelText, exactMatch } = input;
        const pattern = exactMatch ? null : new RegExp(labelText, "i");
        return links.findIndex((link) => {
          const labels = [
            link.innerText,
            link.getAttribute("aria-label"),
            link.getAttribute("title"),
          ]
            .filter(Boolean)
            .map((value) => value.replace(/\s+/g, " ").trim())
            .filter(Boolean);
          const visible = Boolean(
            link.offsetWidth ||
              link.offsetHeight ||
              link.getClientRects().length,
          );
          if (!visible) return false;
          return labels.some((text) =>
            exactMatch ? text === labelText : pattern.test(text),
          );
        });
      },
      { labelText: String(label), exactMatch: exact },
    );

    if (index >= 0) {
      const link = page.locator("a").nth(index);
      await markLinkLocatorCovered(link);
      await link.click({ timeout: 15000 });
      return;
    }
    await page.waitForTimeout(250);
  }

  const available = await page.locator("a").evaluateAll((links) =>
    links
      .flatMap((link) => [
        link.innerText,
        link.getAttribute("aria-label"),
        link.getAttribute("title"),
      ])
      .filter(Boolean)
      .map((value) => value.replace(/\s+/g, " ").trim())
      .filter(Boolean),
  );
  throw new Error(
    `Link not found: ${label}. Available links: ${available.join(" | ")}`,
  );
}

async function clickNavigationLink(page, label, urlPattern) {
  const link = page.getByRole("link", { name: label, exact: true }).first();
  await link.waitFor({ state: "visible", timeout: routeNavigationTimeoutMs });
  await markLinkLocatorCovered(link);
  await Promise.all([
    page.waitForURL(
      (url) =>
        typeof urlPattern === "function"
          ? urlPattern(url)
          : urlPattern.test(url.href),
      {
        timeout: routeNavigationTimeoutMs,
        waitUntil: "commit",
      },
    ),
    link.click({ timeout: routeNavigationTimeoutMs }),
  ]);
  await waitForPageUrl(page, urlPattern, label);
  await page
    .waitForLoadState("networkidle", {
      timeout: routeNavigationTimeoutMs,
    })
    .catch(() => undefined);
}

async function clickLinkIn(locator, label) {
  const link = locator.getByRole("link", { name: label, exact: true }).first();
  await link.waitFor({ state: "visible", timeout: 15000 });
  await markLinkLocatorCovered(link);
  await link.click();
}

async function clickButtonIn(locator, label) {
  const button = locator.getByRole("button", { name: label, exact: true }).first();
  await clickButtonLocator(button, `${label} button`);
}

async function clickButtonLocator(button, label = "button") {
  await button.waitFor({ state: "visible", timeout: 15000 });
  assert(!(await locatorIsDisabled(button)), `${label} is disabled`);
  await markButtonLocatorCovered(button);
  await button.click({ timeout: 15000 });
}

async function assertLocatorFocused(locator, label) {
  const focused = await locator.evaluate((element) => document.activeElement === element);
  assert(focused, `${label} did not receive keyboard focus`);
}

async function activeElementLabel(page) {
  return await page.evaluate(() => {
    function byLabelledBy(element) {
      const labelledBy = element.getAttribute("aria-labelledby");
      if (!labelledBy) return "";
      return labelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent ?? "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    }

    const element = document.activeElement;
    if (!element) return "";
    return (
      element.getAttribute("aria-label") ||
      byLabelledBy(element) ||
      element.textContent ||
      element.getAttribute("placeholder") ||
      element.getAttribute("title") ||
      ""
    )
      .replace(/\s+/g, " ")
      .trim();
  });
}

async function assertActiveElementLabel(page, pattern, label) {
  const text = await activeElementLabel(page);
  assert(pattern.test(text), `${label} focused "${text}"`);
}

async function assertFocusInside(locator, label) {
  const inside = await locator.evaluate((element) =>
    element.contains(document.activeElement),
  );
  assert(inside, `${label} did not keep focus inside the expected container`);
}

async function keyboardActivateButtonLocator(button, label = "button", key = "Enter") {
  await button.waitFor({ state: "visible", timeout: 15000 });
  assert(!(await locatorIsDisabled(button)), `${label} is disabled`);
  await markButtonLocatorCovered(button);
  await button.focus();
  await assertLocatorFocused(button, label);
  await button.press(key, { timeout: 15000 });
}

async function keyboardActivateLinkLocator(link, label = "link") {
  await link.waitFor({ state: "visible", timeout: 15000 });
  await markLinkLocatorCovered(link);
  await link.focus();
  await assertLocatorFocused(link, label);
  await link.press("Enter", { timeout: 15000 });
}

async function clickAllButtons(page, selector) {
  const locator = page.locator(selector);
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const button = locator.nth(index);
    await clickButtonLocator(button, `${selector} ${index + 1}`);
    await page.waitForTimeout(150);
  }
}

async function markAppRouteLinksCovered(locator, extraLabels = []) {
  await markVisibleLinksCoveredByLabel(locator, appRouteLinkLabels);
  if (extraLabels.length > 0) {
    await markVisibleLinksCoveredByLabel(locator, extraLabels, {
      requireAll: false,
    });
  }
}

async function markChatReadinessLinksCovered(locator) {
  await locator
    .getByRole("link", { name: "Open Settings", exact: true })
    .first()
    .waitFor({ state: "visible", timeout: 5000 })
    .catch(() => undefined);
  await locator
    .getByRole("link", { name: "Export Diagnostics", exact: true })
    .first()
    .waitFor({ state: "visible", timeout: 5000 })
    .catch(() => undefined);
  await markAppRouteLinksCovered(locator, [
    "Open Settings",
    "Export Diagnostics",
  ]);
  await markVisibleLinksCoveredByHref(locator, chatReadinessLinkHrefs, {
    requireAll: false,
  });
}

async function setInputValue(page, selector, value) {
  await page.locator(selector).fill(value, { timeout: 10000 });
}

async function expectText(page, text, label = text, timeout = 90000) {
  await page
    .getByText(text, { exact: false })
    .first()
    .waitFor({ state: "visible", timeout })
    .catch(() => {
      throw new Error(`Expected page text was missing: ${label}`);
    });
}

async function waitForManualQaStatus(manualQaPanel, status) {
  await manualQaPanel
    .locator(".settings-manual-qa-item-status")
    .filter({ hasText: status })
    .first()
    .waitFor({ state: "visible", timeout: 15000 });
}

async function setManualQaItemStatus(manualQaItem, actionLabel, expectedStatus) {
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await clickButtonIn(manualQaItem, actionLabel);
    try {
      await waitForManualQaStatus(manualQaItem, expectedStatus);
      return;
    } catch (error) {
      lastError = error;
      await delay(500 * attempt);
    }
  }

  throw lastError ?? new Error(`Manual QA status did not become ${expectedStatus}`);
}

async function getFirstRunPanel(page) {
  const firstRunPanel = page.locator(".settings-first-run-panel").first();
  await firstRunPanel.waitFor({ state: "visible", timeout: 15000 });
  return firstRunPanel;
}

async function clickFirstRunNavigationAction(page, panel, label, urlPredicate, routeLabel) {
  const button = panel.getByRole("button", { name: label, exact: true }).first();
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < routeNavigationTimeoutMs) {
    try {
      await clickEnabledLocator(button, `${label} first-run action`, 10000);
      await waitForPageUrl(page, urlPredicate, routeLabel, 10000);
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(500);
    }
  }

  throw lastError ?? new Error(`Unable to navigate via first-run action: ${label}`);
}

async function waitForPageUrl(page, matcher, label, timeout = routeNavigationTimeoutMs) {
  const startedAt = Date.now();
  let current = "";

  while (Date.now() - startedAt < timeout) {
    current = page.url();
    const url = new URL(current);
    const matched =
      typeof matcher === "function" ? matcher(url) : matcher.test(current);
    if (matched) return;
    await page.waitForTimeout(100);
  }

  throw new Error(`Expected URL ${label}. Current URL: ${current}`);
}

async function gotoAndExpectText(page, url, text, label = text) {
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await page
      .goto(url, {
        waitUntil: "domcontentloaded",
        timeout: routeNavigationTimeoutMs,
      })
      .catch((error) => {
        lastError = error;
        return null;
      });

    if (!response || response.status() < 500) {
      try {
        await expectText(page, text, label, 20000);
        return;
      } catch (error) {
        lastError = error;
      }
    } else {
      lastError = new Error(`Page returned HTTP ${response.status()}: ${url}`);
    }

    await page.waitForTimeout(1000 * attempt);
  }

  throw lastError ?? new Error(`Unable to load ${url}`);
}

async function gotoSettingsAndExpectText(page, baseUrl, text, label = text) {
  const stopIgnoringReloadIssues = ignoreKnownNextDevReloadIssues();
  try {
    await gotoAndExpectText(page, `${baseUrl}/settings`, text, label);
  } finally {
    stopIgnoringReloadIssues();
  }
}

async function expectInputValue(page, selector, expectedValue) {
  await waitForLocatorInputValue(
    page.locator(selector).first(),
    expectedValue,
    `Expected ${selector} to contain "${expectedValue}"`,
  );
}

async function waitForLocatorInputValue(
  locator,
  expectedValue,
  message,
  timeout = 15000,
) {
  const startedAt = Date.now();
  let actualValue = "";
  while (Date.now() - startedAt < timeout) {
    actualValue = await locator.inputValue().catch(() => "");
    if (actualValue === expectedValue) return;
    await delay(100);
  }
  throw new Error(`${message}. Got "${actualValue}".`);
}

function documentText(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

async function runApiSmoke(baseUrl, workspacePath) {
  const index = await jsonFetch(baseUrl, "/api/index", { method: "POST" });
  assert(index.status === "ready", `Index did not rebuild to ready: ${index.status}`);
  assert(index.skillCount >= 1, "Index rebuilt with no skills");

  const checks = [
    ["/api/index", "index"],
    ["/api/chat/status", "chat status"],
    ["/api/release/readiness", "release readiness"],
    ["/api/settings/doctor", "setup doctor"],
    ["/api/settings/runtime", "runtime status"],
    [
      `/api/settings/path-exists?path=${encodeURIComponent(workspacePath)}`,
      "path validation",
    ],
    ["/api/settings/claude-cli/profiles", "claude profiles"],
    ["/api/settings/claude-project", "claude project"],
    ["/api/skills/validation", "skill validation"],
    ["/api/skills/templates", "skill templates"],
    ["/api/skills", "skills list"],
  ];

  for (const [pathName, label] of checks) {
    const payload = await jsonFetch(baseUrl, pathName);
    assertNoUnsafe(label, payload);
  }

  const zip = await binaryFetch(baseUrl, "/api/export/zip?diagnostics=true");
  const entries = extractZipEntries(zip);
  for (const expected of [
    "diagnostics/manifest.json",
    "diagnostics/readiness.json",
    "diagnostics/index.json",
    "diagnostics/skill-quality.json",
    "diagnostics/claude-project.json",
    "diagnostics/settings-summary.json",
  ]) {
    assert(typeof entries[expected] === "string", `Diagnostics ZIP missing ${expected}`);
  }
  assertDiagnosticsZipEntries(entries, "diagnostics API ZIP");
  assertNoUnsafe("diagnostics zip names", Object.keys(entries).join("\n"));

  const singleSkillExport = await binaryFetch(
    baseUrl,
    "/api/export?skill=release-readiness-smoke",
  );
  const singleSkillExportText = singleSkillExport.toString("utf-8");
  assert(
    singleSkillExportText.includes("Skill Workshop V1 release candidate is ready."),
    "Individual skill export did not include the expected demo skill content",
  );
  assertNoUnsafe("individual skill export", singleSkillExportText);
}

async function runNavigationSmoke(page, baseUrl) {
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await waitForPageUrl(page, /\/skills(?:[?#].*)?$/, "home redirect to skills");
  await expectText(page, "Library Readiness");

  await page.goto(`${baseUrl}/skills`, { waitUntil: "networkidle" });
  await expectText(page, "Library Readiness");
  await clickNavigationLink(page, "RAG Chat", /\/chat(?:[?#].*)?$/);
  await expectText(page, "Chat Readiness");
  await clickNavigationLink(page, "Settings", /\/settings(?:[?#].*)?$/);
  await expectText(page, "Setup Doctor");
  await clickNavigationLink(page, "Export", /\/export(?:[?#].*)?$/);
  await expectText(page, "Export");
  await clickNavigationLink(page, "New Skill", /\/editor(?:[?#].*)?$/);
  await expectText(page, "Template Gallery");
  await clickNavigationLink(page, "Skills", /\/skills(?:[?#].*)?$/);
  await expectText(page, "Library Readiness");
}

async function runKeyboardNavigationSmoke(page, baseUrl) {
  await page.goto(`${baseUrl}/skills`, { waitUntil: "networkidle" });
  await expectText(page, "Library Readiness");

  const chatLink = page.getByRole("link", { name: "RAG Chat", exact: true }).first();
  await Promise.all([
    page.waitForURL("**/chat", {
      timeout: routeNavigationTimeoutMs,
      waitUntil: "commit",
    }),
    keyboardActivateLinkLocator(chatLink, "RAG Chat navigation link"),
  ]);
  await expectText(page, "Chat Readiness");

  const settingsLink = page
    .getByRole("link", { name: "Settings", exact: true })
    .first();
  await Promise.all([
    page.waitForURL("**/settings", {
      timeout: routeNavigationTimeoutMs,
      waitUntil: "commit",
    }),
    keyboardActivateLinkLocator(settingsLink, "Settings navigation link"),
  ]);
  await expectText(page, "Setup Doctor");
}

async function runPathPickerSmoke(page, workspacePath) {
  const workspaceInput = page.locator("#settings-workspace-root");
  const pickerChildName = "smoke-picker-child";
  const pickerChildPath = path.join(workspacePath, pickerChildName);
  await workspaceInput.waitFor({ state: "visible", timeout: 15000 });
  await workspaceInput.fill(workspacePath);

  await clickButton(page, "Use typed");
  await expectText(
    page,
    "Path selected. Save Settings to persist this value.",
    "typed path picker feedback",
  );
  await waitForLocatorInputValue(
    workspaceInput,
    workspacePath,
    "Use typed did not keep the typed workspace path",
  );

  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/settings/browse") &&
      response.request().method() === "GET",
    ),
    clickButton(page, "Browse app"),
  ]);
  await expectText(page, "Choose a local folder path", "path picker dialog");

  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible", timeout: 15000 });
  const addressInput = dialog.getByRole("textbox", { name: "Folder path" });
  await addressInput.waitFor({ state: "visible", timeout: 15000 });
  const sidebar = dialog.locator(".path-picker-sidebar").first();
  const addressForm = dialog.locator(".path-picker-address-form").first();
  const entryList = dialog.locator(".path-picker-list").first();
  await waitForLocatorInputValue(
    addressInput,
    workspacePath,
    "Path picker did not open at the typed workspace path",
  );

  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/settings/browse") &&
      response.request().method() === "GET",
    ),
    clickButton(page, "Go"),
  ]);
  await waitForLocatorInputValue(
    addressInput,
    workspacePath,
    "Path picker Go did not keep the current workspace path",
  );

  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/settings/browse") &&
      response.request().method() === "GET",
    ),
    clickButtonLocator(
      entryList.locator(".path-picker-entry").filter({ hasText: pickerChildName }).first(),
      "Path picker child folder entry",
    ),
  ]);
  await waitForLocatorInputValue(
    addressInput,
    pickerChildPath,
    "Path picker folder entry did not navigate to the selected child folder",
  );

  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/settings/browse") &&
      response.request().method() === "GET",
    ),
    clickButtonLocator(
      dialog
        .locator(".path-picker-breadcrumbs")
        .getByRole("button", {
          name: path.basename(workspacePath),
          exact: true,
        })
        .first(),
      "Path picker workspace breadcrumb",
    ),
  ]);
  await waitForLocatorInputValue(
    addressInput,
    workspacePath,
    "Path picker breadcrumb did not navigate back to the workspace folder",
  );

  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/settings/browse") &&
      response.request().method() === "GET",
    ),
    clickButtonLocator(
      sidebar.getByRole("button", { name: "This PC", exact: true }).first(),
      "Path picker sidebar This PC button",
    ),
  ]);
  await waitForLocatorInputValue(
    addressInput,
    "",
    "Path picker sidebar This PC did not navigate to the root view",
  );

  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/settings/browse") &&
      response.request().method() === "GET",
    ),
    clickButtonLocator(
      sidebar.getByRole("button", { name: "Current value", exact: true }).first(),
      "Path picker sidebar Current value button",
    ),
  ]);
  await waitForLocatorInputValue(
    addressInput,
    workspacePath,
    "Path picker sidebar Current value did not return to the workspace path",
  );

  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/settings/browse") &&
      response.request().method() === "GET",
    ),
    clickButtonLocator(
      addressForm.getByRole("button", { name: "This PC", exact: true }).first(),
      "Path picker address This PC button",
    ),
  ]);
  await waitForLocatorInputValue(
    addressInput,
    "",
    "Path picker address This PC did not navigate to the root view",
  );

  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/settings/browse") &&
      response.request().method() === "GET",
    ),
    clickButtonLocator(
      sidebar.getByRole("button", { name: "Current value", exact: true }).first(),
      "Path picker sidebar Current value button after root",
    ),
  ]);
  await waitForLocatorInputValue(
    addressInput,
    workspacePath,
    "Path picker Current value did not return from root to the workspace path",
  );

  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/settings/browse") &&
      response.request().method() === "GET",
    ),
    clickButton(page, "Up"),
  ]);
  const parentPath = path.dirname(workspacePath);
  await waitForLocatorInputValue(
    addressInput,
    parentPath,
    "Path picker Up did not navigate to the parent folder",
  );

  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/settings/browse") &&
      response.request().method() === "GET",
    ),
    clickButton(page, "Current value"),
  ]);
  await waitForLocatorInputValue(
    addressInput,
    workspacePath,
    "Path picker Current value did not return to the workspace path",
  );

  await clickButton(page, "Select folder");
  await dialog.waitFor({ state: "hidden", timeout: 15000 });
  await waitForLocatorInputValue(
    workspaceInput,
    workspacePath,
    "Path picker Select folder did not apply the workspace path",
  );

  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/settings/browse") &&
      response.request().method() === "GET",
    ),
    clickButton(page, "Browse app"),
  ]);
  await dialog.waitFor({ state: "visible", timeout: 15000 });
  await clickButton(page, "Cancel");
  await dialog.waitFor({ state: "hidden", timeout: 15000 });

  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/settings/browse") &&
      response.request().method() === "GET",
    ),
    clickButton(page, "Browse app"),
  ]);
  await dialog.waitFor({ state: "visible", timeout: 15000 });
  await clickButtonLocator(
    dialog.getByRole("button", { name: "Close", exact: true }).first(),
    "Path picker header Close button",
  );
  await dialog.waitFor({ state: "hidden", timeout: 15000 });

  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/settings/browse") &&
      response.request().method() === "GET",
    ),
    clickButton(page, "Browse app"),
  ]);
  await dialog.waitFor({ state: "visible", timeout: 15000 });
  const recentShortcut = dialog
    .locator(".path-picker-sidebar button")
    .filter({ hasText: "workspace" })
    .last();
  assert(
    (await recentShortcut.count()) > 0,
    "Path picker recent shortcut for the selected workspace was not rendered",
  );
  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/settings/browse") &&
      response.request().method() === "GET",
    ),
    clickButtonLocator(recentShortcut, "Path picker recent workspace shortcut"),
  ]);
  await waitForLocatorInputValue(
    addressInput,
    workspacePath,
    "Path picker recent shortcut did not navigate to the selected workspace path",
  );
  await dialog.focus();
  await dialog.press("Escape");
  await dialog.waitFor({ state: "hidden", timeout: 15000 });

  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/settings/browse") &&
      response.request().method() === "GET",
    ),
    keyboardActivateButtonLocator(
      page.getByRole("button", { name: "Browse app", exact: true }).first(),
      "Path picker Browse app button",
    ),
  ]);
  await dialog.waitFor({ state: "visible", timeout: 15000 });
  await assertLocatorFocused(addressInput, "Path picker address input");
  await clickButtonLocator(
    sidebar.getByRole("button", { name: "Current value", exact: true }).first(),
    "Path picker keyboard Current value reset",
  );
  await waitForLocatorInputValue(
    addressInput,
    workspacePath,
    "Path picker keyboard reopen did not restore the workspace path",
  );

  const closeButton = dialog.getByRole("button", { name: "Close", exact: true }).first();
  await closeButton.focus();
  await assertLocatorFocused(closeButton, "Path picker close button");
  await page.keyboard.press("Shift+Tab");
  await assertActiveElementLabel(
    page,
    /^Select folder$/,
    "Path picker Shift+Tab focus wrap",
  );
  await assertFocusInside(dialog, "Path picker Shift+Tab focus trap");
  await page.keyboard.press("Tab");
  await assertActiveElementLabel(page, /^Close$/, "Path picker Tab focus wrap");
  await assertFocusInside(dialog, "Path picker Tab focus trap");
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden", timeout: 15000 });

  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/settings/browse") &&
      response.request().method() === "GET",
    ),
    keyboardActivateButtonLocator(
      page.getByRole("button", { name: "Browse app", exact: true }).first(),
      "Path picker Browse app button for keyboard select",
    ),
  ]);
  await dialog.waitFor({ state: "visible", timeout: 15000 });
  await keyboardActivateButtonLocator(
    dialog.getByRole("button", { name: "Select folder", exact: true }).first(),
    "Path picker Select folder button",
  );
  await dialog.waitFor({ state: "hidden", timeout: 15000 });
  await waitForLocatorInputValue(
    workspaceInput,
    workspacePath,
    "Path picker keyboard Select folder did not apply the workspace path",
  );
}

async function runRelativePathPickerSmoke(page, workspacePath) {
  const skillsInput = page.locator("#settings-skills-dir");
  const skillsBrowsePath = path.join(workspacePath, ".claude", "skills");
  await skillsInput.waitFor({ state: "visible", timeout: 15000 });
  await skillsInput.fill(".claude/skills");

  const control = skillsInput
    .locator(
      "xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' path-picker-control ')]",
    )
    .first();
  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/settings/browse") &&
      response.request().method() === "GET",
    ),
    clickButtonLocator(
      control.getByRole("button", { name: "Browse app", exact: true }).first(),
      "SKILLS_DIR Browse app button",
    ),
  ]);

  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible", timeout: 15000 });
  const addressInput = dialog.getByRole("textbox", { name: "Folder path" });
  await waitForLocatorInputValue(
    addressInput,
    skillsBrowsePath,
    "Relative path picker did not open at the resolved skills folder",
  );

  const sidebar = dialog.locator(".path-picker-sidebar").first();
  assert(
    (await sidebar
      .getByRole("button", { name: "Current value", exact: true })
      .count()) === 0,
    "Relative path picker should not expose a raw relative Current value shortcut",
  );

  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/settings/browse") &&
      response.request().method() === "GET",
    ),
    clickButtonLocator(
      dialog
        .locator(".path-picker-address-form")
        .getByRole("button", { name: "This PC", exact: true })
        .first(),
      "Relative path picker address This PC button",
    ),
  ]);
  await waitForLocatorInputValue(
    addressInput,
    "",
    "Relative path picker This PC did not navigate to the root view",
  );

  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/settings/browse") &&
      response.request().method() === "GET",
    ),
    clickButtonLocator(
      sidebar.getByRole("button", { name: "Start folder", exact: true }).first(),
      "Relative path picker Start folder button",
    ),
  ]);
  await waitForLocatorInputValue(
    addressInput,
    skillsBrowsePath,
    "Relative path picker Start folder did not restore the resolved skills path",
  );

  await clickButtonLocator(
    dialog.getByRole("button", { name: "Cancel", exact: true }).first(),
    "Relative path picker Cancel button",
  );
  await dialog.waitFor({ state: "hidden", timeout: 15000 });
}

async function runMockedNativeFolderPickerSmoke(page, workspacePath) {
  const workspaceInput = page.locator("#settings-workspace-root");
  await workspaceInput.waitFor({ state: "visible", timeout: 15000 });
  await workspaceInput.fill("");

  const responses = [
    { status: 200, body: { path: workspacePath } },
    { status: 200, body: { cancelled: true } },
    {
      status: 500,
      body: {
        error: "Native folder picker is unavailable. Use Browse app instead.",
      },
    },
  ];

  await page.route("**/api/settings/native-folder**", async (route) => {
    const response = responses.shift() ?? responses.at(-1);
    await route.fulfill({
      status: response.status,
      contentType: "application/json",
      body: JSON.stringify(response.body),
    });
  });

  try {
    await Promise.all([
      waitForApiResponse(page, (response) =>
        response.url().includes("/api/settings/native-folder") &&
        response.request().method() === "GET",
      ),
      clickButton(page, "Choose folder"),
    ]);
    await expectText(
      page,
      "Path selected. Save Settings to persist this value.",
      "native folder picker selected path feedback",
    );
    await waitForLocatorInputValue(
      workspaceInput,
      workspacePath,
      "Native folder picker did not apply the selected workspace path",
    );

    await Promise.all([
      waitForApiResponse(page, (response) =>
        response.url().includes("/api/settings/native-folder") &&
        response.request().method() === "GET",
      ),
      clickButton(page, "Choose folder"),
    ]);
    await waitForLocatorInputValue(
      workspaceInput,
      workspacePath,
      "Native folder picker cancel should leave the selected workspace path unchanged",
    );

    expectBrowserIssue(/http 500: .*\/api\/settings\/native-folder/);
    expectBrowserIssue(
      /console: Failed to load resource: the server responded with a status of 500/,
    );
    await Promise.all([
      waitForApiResponse(page, (response) =>
        response.url().includes("/api/settings/native-folder") &&
        response.request().method() === "GET",
      ),
      clickButton(page, "Choose folder"),
    ]);
    await expectText(
      page,
      "Native folder picker is unavailable. Use Browse app instead.",
      "native folder picker error fallback",
    );
    await waitForLocatorInputValue(
      workspaceInput,
      workspacePath,
      "Native folder picker error should leave the selected workspace path unchanged",
    );
  } finally {
    await page.unroute("**/api/settings/native-folder**");
  }
}

async function importSettingsEnvFile(page, buttonLabel, importPath) {
  const importButton = page
    .getByRole("button", { name: buttonLabel, exact: true })
    .first();
  await importButton.waitFor({ state: "visible", timeout: 15000 });
  assert(!(await locatorIsDisabled(importButton)), `${buttonLabel} button is disabled`);
  let fileChooser = null;
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      [fileChooser] = await Promise.all([
        page.waitForEvent("filechooser", { timeout: 10000 }),
        clickEnabledLocator(importButton, `${buttonLabel} button`, 10000),
      ]);
      break;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(500 * attempt);
    }
  }

  if (!fileChooser) {
    throw lastError ?? new Error(`${buttonLabel} did not open a file chooser`);
  }

  await fileChooser.setFiles(importPath);
  await expectText(page, "Imported \"smoke-settings.env\". Review and save.");
  const rawText = await page.locator("textarea").first().inputValue();
  assert(
    rawText.includes("NEXT_PUBLIC_APP_TITLE=Smoke Imported Settings"),
    `${buttonLabel} did not load the imported env file into the raw editor`,
  );
}

async function runSettingsWorkspaceProfileSmoke(page, workspacePath) {
  await clickButton(page, "Save Current");
  await expectText(page, "Enter a workspace profile name first.");
  await clickButton(page, "Dismiss");

  await page.locator("#settings-workspace-profile-name").fill("Smoke Profile");
  await clickButton(page, "Save Current");
  await expectText(page, "Workspace profile saved locally.");
  await clickButton(page, "Dismiss");
  await expectText(page, "Smoke Profile");

  await clickButtonLocator(
    page.getByRole("button", { name: "Apply", exact: true }).last(),
    "Apply button",
  );
  await expectText(page, "Workspace profile applied. Save settings, then rebuild the index.");
  assert(
    (await page.locator("#settings-workspace-root").inputValue()) === workspacePath,
    "Workspace profile apply did not restore the saved workspace path",
  );
  await clickButton(page, "Dismiss");

  await clickButtonLocator(
    page.getByRole("button", { name: "Remove", exact: true }).last(),
    "Remove button",
  );
  await expectText(page, "Save common workspace path pairs here");
}

async function runSettingsSmoke(page, baseUrl, workspacePath, settingsImportPath) {
  await gotoSettingsAndExpectText(
    page,
    baseUrl,
    "V1 Release Readiness",
    "settings readiness panel",
  );
  await expectText(page, "V1 Release Readiness");
  await expectText(page, "Manual QA Evidence");
  await expectText(page, "npm run qa:manual");
  const manualQaPanel = page.locator(".settings-manual-qa-panel").first();
  await manualQaPanel.waitFor({ state: "visible", timeout: 15000 });
  const manualQaItem = manualQaPanel.locator(".settings-manual-qa-item").first();
  await manualQaItem.waitFor({ state: "visible", timeout: 15000 });
  await expectText(page, "Stores only status and timestamp in this browser.");
  await setManualQaItemStatus(manualQaItem, "Mark Passed", "Passed");
  await setManualQaItemStatus(manualQaItem, "Needs Fix", "Needs fix");
  await setManualQaItemStatus(manualQaItem, "Reset", "Pending");
  await expectText(page, "First Run Checklist");
  await expectText(page, "Setup Doctor");
  let firstRunPanel = await getFirstRunPanel(page);

  await clickFirstRunNavigationAction(
    page,
    firstRunPanel,
    "Export",
    (url) =>
      url.pathname === "/export" && url.searchParams.get("diagnostics") === "true",
    "first-run diagnostics export route",
  );
  await expectText(page, "Export Skills");
  await gotoSettingsAndExpectText(
    page,
    baseUrl,
    "First Run Checklist",
    "settings first run checklist after diagnostics action",
  );
  await expectText(page, "Diagnostics export was opened in this session.");

  firstRunPanel = await getFirstRunPanel(page);
  await clickFirstRunNavigationAction(
    page,
    firstRunPanel,
    "Open Export",
    (url) =>
      url.pathname === "/export" && url.searchParams.get("diagnostics") === "true",
    "first-run open export route",
  );
  await expectText(page, "Export Skills");
  await gotoSettingsAndExpectText(
    page,
    baseUrl,
    "First Run Checklist",
    "settings first run checklist after open export action",
  );

  firstRunPanel = await getFirstRunPanel(page);
  await clickFirstRunNavigationAction(
    page,
    firstRunPanel,
    "Open Chat",
    (url) => url.pathname === "/chat",
    "first-run open chat route",
  );
  await expectText(page, "Chat Readiness");
  await gotoSettingsAndExpectText(
    page,
    baseUrl,
    "First Run Checklist",
    "settings first run checklist after open chat action",
  );

  await importSettingsEnvFile(page, "Import .env file", settingsImportPath);
  await clickButton(page, "Dismiss");

  await clickButton(page, "Raw .env Editor");
  await page
    .locator("textarea")
    .first()
    .waitFor({ state: "visible", timeout: 15000 })
    .catch(() => {
      throw new Error("Raw env textarea did not render");
    });
  await importSettingsEnvFile(page, "Import file", settingsImportPath);
  await clickButton(page, "Dismiss");

  await clickButton(page, "Config Fields");

  const extraInputCountBefore = await page.locator("input").count();
  await clickButton(page, "+ Add");
  const extraInputCountAfterAdd = await page.locator("input").count();
  assert(extraInputCountAfterAdd > extraInputCountBefore, "Extra env row was not added");
  await clickButtonLocator(
    page.locator("button[aria-label*='Remove']").last(),
    "Remove extra env row button",
  );
  await page.waitForTimeout(300);
  const extraInputCountAfterRemove = await page.locator("input").count();
  assert(extraInputCountAfterRemove <= extraInputCountBefore, "Extra env row was not removed");

  const showButton = page.getByRole("button", { name: "Show", exact: true }).first();
  if (await showButton.count()) {
    await showButton.click();
    await clickButton(page, "Hide");
  }

  await runMockedNativeFolderPickerSmoke(page, workspacePath);
  await runPathPickerSmoke(page, workspacePath);
  await runRelativePathPickerSmoke(page, workspacePath);
  await runSettingsWorkspaceProfileSmoke(page, workspacePath);

  const stopIgnoringReloadIssues = ignoreKnownNextDevReloadIssues();
  try {
    await Promise.all([
      waitForApiResponse(page, (response) =>
        response.url().includes("/api/settings") &&
        response.request().method() === "POST",
      ),
      clickButton(page, "^Save( Changes)?$", { exact: false }),
    ]);
    await expectText(page, "Saved and applied to this server session.");

    await waitForEnabledButton(page, "Refresh");
    await clickButton(page, "Refresh");
    await Promise.all([
      waitForApiResponse(page, (response) =>
        response.url().includes("/api/index") &&
        response.request().method() === "POST",
      ),
      clickButton(page, "Rebuild Index"),
    ]);
    await waitForButtonHidden(page, "Rebuilding...");
    await waitForButtonHidden(page, "Rendering . . .");
    await waitForDevRenderingSettled(page);
  } finally {
    stopIgnoringReloadIssues();
  }
  try {
    await clickButton(page, "Show", { timeout: 1000 });
    await clickButton(page, "Hide");
  } catch {
    // No visible secret toggle is present in this state.
  }
  const stopIgnoringFinalReloadIssues = ignoreKnownNextDevReloadIssues();
  try {
    await Promise.all([
      waitForApiResponse(page, (response) =>
        response.url().includes("/api/settings") &&
        response.request().method() === "POST",
      ),
      clickButton(page, "Save"),
    ]);
    await expectText(page, "Saved and applied to this server session.");
    const readinessStrip = page.locator(".settings-readiness-strip").first();
    const readinessOpenSettings = readinessStrip
      .getByRole("link", { name: /^Open Settings:/ })
      .first();
    if (
      (await readinessOpenSettings.count()) > 0 &&
      (await readinessOpenSettings.isVisible())
    ) {
      await markLinkLocatorCovered(readinessOpenSettings);
      await readinessOpenSettings.click();
      await waitForPageUrl(
        page,
        (url) => url.pathname === "/settings",
        "settings readiness Open Settings route",
      );
      await expectText(page, "Setup Doctor");
    }
  } finally {
    stopIgnoringFinalReloadIssues();
  }
  await clickButton(page, "Dismiss", { timeout: 1000 }).catch(() => undefined);
  await markVisibleButtonsCoveredByLabel(page, [
    "Use typed",
    "Choose folder",
    "Browse app",
    "Open Login",
    "Test CLI",
    "Save Provider",
    "Open Export",
    "Rebuild Index",
    "Save",
    "Open Chat",
    "Mark Passed",
    "Needs Fix",
    "Reset",
  ]);
  await markVisibleButtonsCoveredByLabel(page, ["Refresh"], { requireAll: false });
  await markAppRouteLinksCovered(page, ["Open Settings"]);
  await assertVisibleButtonsAccountedFor(page, "Settings");
  await assertVisibleLinksAccountedFor(page, "Settings");
  await assertInteractiveControlsAccessible(page, "Settings");
}

function mockClaudeCliStatusPayload(lastCliSmokeTest = null) {
  const selectedProfile = {
    id: "default",
    label: "Default profile",
    source: "default",
    displayPath: "~\\.claude",
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
    provider: "claude_code_cli",
    enabled: true,
    cliPath: "claude",
    configuredCliPath: "auto",
    cliPathSource: "path",
    loginCommand: "claude auth login",
    loginCommandSource: "path",
    loginHelperAvailable: false,
    canOpenLogin: true,
    configDirConfigured: false,
    installed: true,
    version: "smoke",
    profiles: [selectedProfile],
    selectedProfile,
    selectedProfileFingerprint: "smoke-default-profile",
    lastCliSmokeTest,
    auth: {
      checked: true,
      loggedIn: true,
      method: "Subscription",
      error: null,
    },
  };
}

async function runMockedSettingsClaudeActionsSmoke(page, baseUrl) {
  let lastCliSmokeTest = null;
  let cliTestCount = 0;

  await page.route("**/api/settings/claude-cli**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (pathname === "/api/settings/claude-cli/test") {
      cliTestCount += 1;
      lastCliSmokeTest =
        cliTestCount === 1
          ? {
              checked: true,
              ok: true,
              output: "OK",
              error: null,
              provider: "claude_code_cli",
              profileId: "default",
              configFingerprint: "smoke-default-profile",
            }
          : {
              checked: true,
              ok: false,
              output: null,
              error: "Smoke Claude CLI test failed.",
              provider: "claude_code_cli",
              profileId: "default",
              configFingerprint: "smoke-default-profile",
            };
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(lastCliSmokeTest),
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

    if (pathname === "/api/settings/claude-cli" && request.method() === "GET") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(mockClaudeCliStatusPayload(lastCliSmokeTest)),
      });
      return;
    }

    await route.continue();
  });

  try {
    await gotoSettingsAndExpectText(
      page,
      baseUrl,
      "Claude CLI",
      "settings Claude CLI panel",
    );
    await expectText(page, "Claude CLI");
    const claudePanel = page.locator(".settings-claude-panel").first();
    const claudeRefreshButton = claudePanel
      .locator(".settings-claude-refresh")
      .first();
    await waitForEnabledLocator(
      claudeRefreshButton,
      "Claude status refresh button",
    );
    await Promise.all([
      waitForApiResponse(page, (response) =>
        response.url().includes("/api/settings/claude-cli") &&
        response.request().method() === "GET",
      ),
      clickEnabledLocator(claudeRefreshButton, "Claude status refresh button"),
    ]);
    await clickButton(page, "Open Login");
    await expectText(page, "Opened claude auth login.");
    await clickButton(page, "Dismiss");
    await clickButton(page, "Test CLI");
    await expectText(page, "Claude CLI test passed.");
    await expectText(page, "Test passed: OK");
    await clickButton(page, "Test CLI");
    await expectText(page, "Smoke Claude CLI test failed.");
    await expectText(page, "Test: Failed - Smoke Claude CLI test failed.");
    await markButtonLocatorCovered(
      claudePanel.locator(".settings-claude-refresh").first(),
    );
    await markButtonLocatorCovered(
      claudePanel.getByRole("button", { name: "Open Login", exact: true }).first(),
    );
    await markButtonLocatorCovered(
      claudePanel.getByRole("button", { name: "Test CLI", exact: true }).first(),
    );
    await assertVisibleButtonsAccountedFor(
      claudePanel,
      "Mocked Settings Claude Actions",
    );
    await assertVisibleLinksAccountedFor(
      claudePanel,
      "Mocked Settings Claude Actions",
    );
    await assertInteractiveControlsAccessible(
      claudePanel,
      "Mocked Settings Claude Actions",
    );
  } finally {
    await page.unroute("**/api/settings/claude-cli**");
  }
}

function mockReleaseReadinessPayload(mode) {
  const sectionDefaults = [
    {
      id: "workspace",
      label: "Workspace",
      status: "ready",
      message: "Workspace paths are ready.",
    },
    {
      id: "provider",
      label: "Provider",
      status: "ready",
      message: "Provider is ready.",
    },
    {
      id: "index",
      label: "Index",
      status: "ready",
      message: "Index is ready.",
      actionLabel: "Rebuild Index",
      actionHref: "/settings",
    },
    {
      id: "skills",
      label: "Skills",
      status: "ready",
      message: "Skill quality is ready.",
    },
    {
      id: "claude_project",
      label: "Claude Project",
      status: "ready",
      message: "Claude project inventory is ready.",
    },
    {
      id: "chat",
      label: "Chat",
      status: "ready",
      message: "Chat is ready.",
      actionLabel: "Go to Chat",
      actionHref: "/chat",
    },
    {
      id: "diagnostics",
      label: "Diagnostics",
      status: "ready",
      message: "Diagnostics export is ready.",
      actionLabel: "Go to Export",
      actionHref: "/export?diagnostics=true",
    },
  ];

  const overrides = {
    workspace: {
      status: "blocked",
      message: "Workspace paths need review.",
      actionLabel: "Open Settings",
      actionHref: "/settings",
    },
    provider: {
      status: "blocked",
      message: "Provider settings need review.",
      actionLabel: "Open Settings",
      actionHref: "/settings",
    },
    chat: {
      status: "blocked",
      message: "Chat needs setup.",
      actionLabel: "Go to Chat",
      actionHref: "/chat",
    },
    diagnostics: {
      status: "needs_action",
      message: "Export diagnostics.",
      actionLabel: "Go to Export",
      actionHref: "/export?diagnostics=true",
    },
  };

  const sections = sectionDefaults.map((section) =>
    section.id === mode ? { ...section, ...overrides[mode] } : section,
  );
  const status = mode === "diagnostics" ? "needs_action" : "blocked";
  const topAction =
    mode === "workspace"
      ? "Review workspace paths."
      : mode === "provider"
        ? "Review provider settings."
        : null;

  return {
    schemaVersion: 1,
    generatedAt: "2026-06-20T00:00:00.000Z",
    summary: {
      status,
      score: mode === "diagnostics" ? 92 : 70,
      topAction,
      canChat: mode !== "chat",
      canExportDiagnostics: true,
    },
    sections,
  };
}

async function runMockedSettingsReleaseActionsSmoke(page, baseUrl) {
  let mode = "workspace";
  let settingsSaveCount = 0;

  await page.route("**/api/release/readiness", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(mockReleaseReadinessPayload(mode)),
    });
  });
  await page.route("**/api/settings", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }

    settingsSaveCount += 1;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        raw: "LLM_PROVIDER=anthropic_api\n",
        parsed: { LLM_PROVIDER: "anthropic_api" },
        activeRuntime: {
          provider: "anthropic_api",
          claudeCliEnabled: false,
          configDirConfigured: false,
          source: "runtime",
        },
      }),
    });
  });

  try {
    await gotoSettingsAndExpectText(
      page,
      baseUrl,
      "Review workspace paths.",
      "mocked release workspace action",
    );
    await clickButton(page, "Save Paths");
    await expectText(page, "Saved and applied to this server session.");
    assert(settingsSaveCount === 1, "Save Paths did not POST settings once");
    await clickButton(page, "Dismiss");

    mode = "provider";
    await gotoSettingsAndExpectText(
      page,
      baseUrl,
      "Review provider settings.",
      "mocked release provider action",
    );
    await clickButton(page, "Save Provider");
    await expectText(page, "Saved and applied to this server session.");
    assert(settingsSaveCount === 2, "Save Provider did not POST settings once");
    await clickButton(page, "Dismiss");

    mode = "chat";
    await gotoSettingsAndExpectText(
      page,
      baseUrl,
      "Chat needs setup.",
      "mocked release chat action",
    );
    await clickButton(page, "Go to Chat");
    await waitForPageUrl(
      page,
      (url) => url.pathname === "/chat",
      "release readiness chat route",
    );
    await expectText(page, "Chat Readiness");

    mode = "diagnostics";
    await gotoSettingsAndExpectText(
      page,
      baseUrl,
      "Export diagnostics.",
      "mocked release diagnostics action",
    );
    await clickButton(page, "Go to Export");
    await waitForPageUrl(
      page,
      (url) =>
        url.pathname === "/export" &&
        url.searchParams.get("diagnostics") === "true",
      "release readiness export route",
    );
    await expectText(page, "Export Skills");
  } finally {
    await page.unroute("**/api/release/readiness");
    await page.unroute("**/api/settings");
  }
}

async function runMockedSkillsImportFailureSmoke(page, baseUrl) {
  let previewShouldFail = true;
  await page.route("**/api/skills/import/preview", async (route) => {
    if (previewShouldFail) {
      previewShouldFail = false;
      expectBrowserIssue(/http 500: .*\/api\/skills\/import\/preview$/);
      expectBrowserIssue(
        /console: Failed to load resource: the server responded with a status of 500/,
      );
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Smoke import preview failed." }),
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        previewId: "smoke-import-preview-failure",
        sourceType: "folder",
        sourceDisplay: "Smoke source",
        skills: [
          {
            name: "smoke-failure-import-skill",
            displayName: "smoke-failure-import-skill.md",
            validationErrors: [],
            qualityWarnings: [],
            duplicate: false,
          },
        ],
        warnings: [],
      }),
    });
  });
  await page.route("**/api/skills/import/apply", async (route) => {
    expectBrowserIssue(/http 500: .*\/api\/skills\/import\/apply$/);
    expectBrowserIssue(
      /console: Failed to load resource: the server responded with a status of 500/,
    );
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Smoke import apply failed." }),
    });
  });

  try {
    await page.goto(`${baseUrl}/skills`, { waitUntil: "networkidle" });
    await expectText(page, "Library Readiness");
    await setInputValue(page, "#skills-import-folder", "C:\\smoke-import-source");
    await clickButton(page, "Preview Folder");
    await expectText(page, "Smoke import preview failed.");
    await clickButton(page, "Preview Folder");
    await expectText(page, "smoke-failure-import-skill");
    await clickButton(page, "Import 1 skill", { timeout: 60000 });
    await expectText(page, "Smoke import apply failed.");
    const importPanel = page.locator(".skills-import-preview-card").first();
    await assertVisibleButtonsAccountedFor(
      importPanel,
      "Mocked Skills Import Failure",
    );
    await assertVisibleLinksAccountedFor(
      importPanel,
      "Mocked Skills Import Failure",
    );
    await assertInteractiveControlsAccessible(
      importPanel,
      "Mocked Skills Import Failure",
    );
  } finally {
    await page.unroute("**/api/skills/import/preview");
    await page.unroute("**/api/skills/import/apply");
  }
}

async function runMockedSkillsImportDuplicateSmoke(page, baseUrl) {
  const applyStrategies = [];

  await page.route("**/api/skills/import/preview", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        previewId: "smoke-duplicate-import-preview",
        sourceType: "folder",
        sourceDisplay: "Smoke duplicate source",
        skills: [
          {
            name: "release-readiness-smoke",
            displayName: "release-readiness-smoke.md",
            validationErrors: [],
            qualityWarnings: ["Smoke duplicate has updated content."],
            duplicate: true,
          },
        ],
        warnings: ["Smoke duplicate preview warning."],
      }),
    });
  });

  await page.route("**/api/skills/import/apply", async (route) => {
    const payload = route.request().postDataJSON();
    assert(
      payload.previewId === "smoke-duplicate-import-preview",
      "Duplicate import apply used the wrong preview id",
    );
    assert(payload.confirm === true, "Duplicate import apply did not confirm");
    assert(
      payload.duplicateStrategy === "rename" ||
        payload.duplicateStrategy === "overwrite",
      `Unexpected duplicate strategy ${payload.duplicateStrategy}`,
    );
    applyStrategies.push(payload.duplicateStrategy);
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(
        payload.duplicateStrategy === "rename"
          ? {
              skipped: [],
              renamed: [{ from: "release-readiness-smoke", to: "release-readiness-smoke-2" }],
              written: ["release-readiness-smoke-2"],
            }
          : {
              skipped: [],
              renamed: [],
              written: ["release-readiness-smoke"],
            },
      ),
    });
  });

  try {
    await page.goto(`${baseUrl}/skills`, { waitUntil: "networkidle" });
    await expectText(page, "Library Readiness");
    await setInputValue(page, "#skills-import-folder", "C:\\smoke-duplicate-source");
    await clickButton(page, "Preview Folder");
    await expectText(page, "Smoke duplicate preview warning.");
    await expectText(page, "release-readiness-smoke.md");
    await expectText(
      page,
      "All previewed skills are duplicates. Choose Rename or Overwrite to import changes.",
    );
    const importPanel = page.locator(".skills-import-preview-card").first();
    const applyButton = importPanel.locator(".skills-import-apply").first();
    assert(
      await locatorIsDisabled(applyButton),
      "Duplicate import should not be applyable while skip would import nothing",
    );

    await page.locator("#skills-duplicate-strategy").selectOption("rename");
    await expectText(page, "Rename duplicates and import 1");
    await clickButtonIn(importPanel, "Rename duplicates and import 1");
    await expectText(page, "Imported 1 skill, renamed 1. Index marked stale.");

    await clickButton(page, "Preview Folder");
    await expectText(page, "release-readiness-smoke.md");
    await page.locator("#skills-duplicate-strategy").selectOption("overwrite");
    await expectText(page, "Type overwrite to confirm replacement.");
    const overwriteApplyButton = page
      .locator(".skills-import-preview-card")
      .first()
      .locator(".skills-import-apply")
      .first();
    assert(
      await locatorIsDisabled(overwriteApplyButton),
      "Overwrite import should stay disabled before typed confirmation",
    );
    await page.locator("#skills-overwrite-confirm").fill("overwrite");
    await expectText(page, "Overwrite and import 1");
    await clickButtonIn(importPanel, "Overwrite and import 1");
    await expectText(page, "Imported 1 skill. Index marked stale.");

    assert(
      JSON.stringify(applyStrategies) === JSON.stringify(["rename", "overwrite"]),
      "Duplicate import did not send expected apply strategies",
    );
    await assertVisibleButtonsAccountedFor(
      importPanel,
      "Mocked Skills Import Duplicates",
    );
    await assertVisibleLinksAccountedFor(
      importPanel,
      "Mocked Skills Import Duplicates",
    );
    await assertInteractiveControlsAccessible(
      importPanel,
      "Mocked Skills Import Duplicates",
    );
  } finally {
    await page.unroute("**/api/skills/import/preview");
    await page.unroute("**/api/skills/import/apply");
  }
}

async function runSkillsSmoke(page, baseUrl, importSource, archivePath) {
  await page.goto(`${baseUrl}/skills`, { waitUntil: "networkidle" });
  await expectText(page, "Library Readiness");
  await clickLink(page, "New");
  await waitForPageUrl(page, (url) => url.pathname === "/editor", "skills New route");
  await expectText(page, "Template Gallery");
  await page.goto(`${baseUrl}/skills`, { waitUntil: "networkidle" });
  await expectText(page, "Library Readiness");
  await clickLink(page, "Guided");
  await waitForPageUrl(
    page,
    (url) => url.pathname === "/editor/guided",
    "skills Guided route",
  );
  await expectText(page, "Guided Skill Builder");
  await page.goto(`${baseUrl}/skills`, { waitUntil: "networkidle" });
  await expectText(page, "Library Readiness");
  await setInputValue(page, "#skills-import-folder", importSource);
  await clickButton(page, "Preview Folder", { timeout: 60000 });
  await expectText(page, "smoke-imported-skill");
  await Promise.all([
    waitForApiResponse(
      page,
      (response) =>
        response.url().includes("/api/skills/import/apply") &&
        response.request().method() === "POST" &&
        response.ok(),
    ),
    clickButton(page, "Import \\d+ skill", {
      exact: false,
      timeout: 60000,
    }),
  ]);
  await expectText(page, "Imported 1 skill. Index marked stale.");

  const demoSkillButton = page
    .locator(".skills-list-scroll button")
    .filter({ hasText: "release-readiness-smoke" })
    .first();
  await clickButtonLocator(demoSkillButton, "release readiness skill button");
  await expectText(page, "release-readiness-smoke.md");

  const importedSkillButton = page
    .locator(".skills-list-scroll button")
    .filter({ hasText: "smoke-imported-skill" })
    .first();
  await importedSkillButton.waitFor({ state: "visible", timeout: 60000 });
  await clickButtonLocator(importedSkillButton, "imported skill button");
  await expectText(page, "smoke-imported-skill.md");
  const skillPreviewPane = page.locator(".skills-preview-pane").first();
  await clickButtonIn(skillPreviewPane, "Delete");
  await expectText(page, "Type the exact skill name to enable delete.");
  const disabledDeleteConfirm = skillPreviewPane
    .getByRole("button", {
      name: "Type smoke-imported-skill to confirm deletion",
      exact: true,
    })
    .first();
  assert(
    await locatorIsDisabled(disabledDeleteConfirm),
    "Delete confirm button should stay disabled until the exact skill name is typed",
  );
  await setInputValue(page, "#skills-delete-confirm", "smoke-imported");
  await expectText(page, "Typed name does not match smoke-imported-skill.");
  await clickButtonIn(skillPreviewPane, "Cancel");
  await skillPreviewPane
    .locator("#skills-delete-confirm")
    .waitFor({ state: "hidden", timeout: 5000 });
  await keyboardActivateButtonLocator(
    skillPreviewPane.getByRole("button", { name: "Delete", exact: true }).first(),
    "Skill delete button",
    "Enter",
  );
  await setInputValue(page, "#skills-delete-confirm", "smoke-imported-skill");
  const deleteConfirmButton = skillPreviewPane
    .locator("button")
    .filter({ hasText: /^(Confirm delete|Delete .*\.md)$/ })
    .first();
  await waitForEnabledLocator(
    deleteConfirmButton,
    "Skill delete confirmation button",
  );
  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/skills/smoke-imported-skill") &&
      response.request().method() === "DELETE",
    ),
    keyboardActivateButtonLocator(
      deleteConfirmButton,
      "Skill delete confirmation button",
      "Enter",
    ),
  ]);
  await expectText(page, "Backup available");
  await Promise.all([
    waitForApiResponse(page, (response) =>
      response.url().includes("/api/skills/smoke-imported-skill/restore") &&
      response.request().method() === "POST",
    ),
    clickButton(page, "Restore smoke-imported-skill"),
  ]);
  await page
    .getByRole("button", { name: "Restoring...", exact: true })
    .waitFor({ state: "hidden", timeout: 10000 });
  await expectText(page, "smoke-imported-skill");

  await page.locator("#skills-import-source").selectOption("archive");
  await page.locator("#skills-import-archive").setInputFiles(archivePath);
  await clickButton(page, "Preview Zip", { timeout: 60000 });
  await expectText(page, "smoke-zip-imported-skill");
  await Promise.all([
    waitForApiResponse(
      page,
      (response) =>
        response.url().includes("/api/skills/import/apply") &&
        response.request().method() === "POST" &&
        response.ok(),
    ),
    clickButton(page, "Import \\d+ skill", {
      exact: false,
      timeout: 60000,
    }),
  ]);
  await expectText(page, "Imported 1 skill. Index marked stale.");

  const zipImportedSkillButton = page
    .locator(".skills-list-scroll button")
    .filter({ hasText: "smoke-zip-imported-skill" })
    .first();
  await zipImportedSkillButton.waitFor({ state: "visible", timeout: 60000 });
  await clickButtonLocator(zipImportedSkillButton, "zip imported skill button");
  await expectText(page, "smoke-zip-imported-skill.md");
  const selectedSkillExportPromise = page.waitForEvent("download");
  await clickLink(page, "Export .md");
  const selectedSkillExport = await selectedSkillExportPromise;
  const selectedSkillExportPath = path.join(
    path.dirname(archivePath),
    "selected-skill-export.md",
  );
  await selectedSkillExport.saveAs(selectedSkillExportPath);
  const selectedSkillExportText = await readFile(selectedSkillExportPath, "utf8");
  assert(
    selectedSkillExportText.includes("Smoke Zip Imported Skill"),
    "Selected skill .md export did not include the expected smoke skill",
  );
  assertNoUnsafe("selected skill .md export", selectedSkillExportText);
  await clickLink(page, "Edit");
  await waitForPageUrl(
    page,
    (url) => url.pathname === "/editor/smoke-zip-imported-skill",
    "selected skill Edit route",
  );
  await expectText(page, "Edit: smoke-zip-imported-skill.md");
  await page.goto(`${baseUrl}/skills`, { waitUntil: "networkidle" });
  await expectText(page, "Library Readiness");
  const previewEmptyActions = page.locator(".skills-preview-empty-actions").first();
  if (
    (await previewEmptyActions.count()) > 0 &&
    (await previewEmptyActions.isVisible())
  ) {
    await clickLinkIn(previewEmptyActions, "Import Skills");
    assert(
      new URL(page.url()).hash === "#skills-import-panel",
      "Skills preview Import Skills link did not target the import panel",
    );
    await Promise.all([
      waitForPageUrl(
        page,
        (url) => url.pathname === "/editor/guided",
        "skills preview Guided Builder route",
      ),
      clickLinkIn(previewEmptyActions, "Guided Builder"),
    ]);
    await expectText(page, "Guided Skill Builder");
    await page.goto(`${baseUrl}/skills`, { waitUntil: "networkidle" });
    await expectText(page, "Library Readiness");
  }

  await page.locator("#skills-search").fill("no-such-smoke-skill");
  await expectText(page, "No matching skills");
  await clickButton(page, "Clear Search");
  await expectText(page, "release-readiness-smoke");
  await markVisibleButtonsCoveredByLabel(page, ["Rebuild Index"]);
  await page.locator(".skills-list-scroll button").evaluateAll((buttons) => {
    for (const button of buttons) {
      const visible = Boolean(
        button.offsetWidth ||
          button.offsetHeight ||
          button.getClientRects().length,
      );
      if (visible) {
        button.__smokeCovered = true;
      }
    }
  });
  await markAppRouteLinksCovered(page, [
    "Guided",
    "New",
    "Guided Builder",
    "Import Skills",
  ]);

  await assertVisibleButtonsAccountedFor(page, "Skills");
  await assertVisibleLinksAccountedFor(page, "Skills");
  await assertInteractiveControlsAccessible(page, "Skills");
}

async function runMockedEmptyStateSmoke(page, baseUrl, smokeRoot) {
  await page.route("**/api/skills", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        skills: [],
        total: 0,
        latestDeleted: null,
      }),
    });
  });
  await page.route("**/api/index", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        status: "missing",
        skillCount: 0,
        chunkCount: 0,
        staleReason: "Smoke empty state has no skills.",
      }),
    });
  });
  await page.route("**/api/skills/validation", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        totalSkills: 0,
        issueCount: 0,
        issues: [],
      }),
    });
  });
  await page.route("**/api/release/readiness", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        summary: {
          status: "needs_action",
          score: 65,
          topAction: "Create or import a skill.",
          canChat: false,
          canExportDiagnostics: true,
        },
        sections: [],
      }),
    });
  });
  await page.route("**/api/export/zip**", async (route) => {
    await route.fulfill({
      headers: {
        "content-disposition": 'attachment; filename="smoke-empty-diagnostics.zip"',
        "content-type": "application/zip",
      },
      body: createZip({
        "diagnostics/readiness.json": JSON.stringify({
          status: "needs_action",
        }),
      }),
    });
  });

  try {
    await page.goto(`${baseUrl}/skills`, { waitUntil: "networkidle" });
    await expectText(page, "No skills yet");
    await expectText(page, "Start with the guided builder");
    const skillsEmptyActions = page.locator(".skills-list-empty-actions").first();
    await clickLinkIn(skillsEmptyActions, "Import Skills");
    assert(
      new URL(page.url()).hash === "#skills-import-panel",
      "Skills empty-state Import Skills link did not target the import panel",
    );
    await clickLinkIn(skillsEmptyActions, "New Skill");
    await waitForPageUrl(
      page,
      (url) => url.pathname === "/editor",
      "skills empty New Skill route",
    );
    await expectText(page, "Template Gallery");

    await page.goto(`${baseUrl}/skills`, { waitUntil: "networkidle" });
    await expectText(page, "No skills yet");
    await clickLinkIn(page.locator(".skills-list-empty-actions").first(), "Guided Builder");
    await waitForPageUrl(
      page,
      (url) => url.pathname === "/editor/guided",
      "skills empty Guided Builder route",
    );
    await expectText(page, "Guided Skill Builder");

    await gotoAndExpectText(
      page,
      `${baseUrl}/export`,
      "No skills are ready to export",
      "empty export state",
    );
    const exportDownloadPromise = page.waitForEvent("download");
    await clickButton(page, "Export Diagnostics");
    const exportDownload = await exportDownloadPromise;
    const exportDownloadPath = path.join(smokeRoot, "empty-diagnostics.zip");
    await exportDownload.saveAs(exportDownloadPath);
    const exportEntries = extractZipEntries(await readFile(exportDownloadPath));
    assert(
      typeof exportEntries["diagnostics/readiness.json"] === "string",
      "Empty export diagnostics ZIP did not contain readiness diagnostics",
    );

    const exportEmptyActions = page.locator(".export-empty-actions").first();
    await clickLinkIn(exportEmptyActions, "Open Skills");
    await waitForPageUrl(
      page,
      (url) => url.pathname === "/skills",
      "export empty Open Skills route",
    );
    await expectText(page, "No skills yet");

    await gotoAndExpectText(
      page,
      `${baseUrl}/export`,
      "No skills are ready to export",
      "empty export state after Open Skills",
    );
    await clickLinkIn(page.locator(".export-empty-actions").first(), "Guided Builder");
    await waitForPageUrl(
      page,
      (url) => url.pathname === "/editor/guided",
      "export empty Guided Builder route",
    );
    await expectText(page, "Guided Skill Builder");

    await assertInteractiveControlsAccessible(page, "Mocked Empty States");
  } finally {
    await page.unroute("**/api/skills");
    await page.unroute("**/api/index");
    await page.unroute("**/api/skills/validation");
    await page.unroute("**/api/release/readiness");
    await page.unroute("**/api/export/zip**");
  }
}

async function verifyChatDiagnosticsLink(page, baseUrl) {
  const diagnosticsLink = page
    .getByRole("link", { name: "Export Diagnostics", exact: true })
    .first();
  if (
    (await diagnosticsLink.count()) > 0 &&
    (await diagnosticsLink.isVisible())
  ) {
    await markLinkLocatorCovered(diagnosticsLink);
    await diagnosticsLink.click();
    await waitForPageUrl(
      page,
      (url) =>
        url.pathname === "/export" &&
        url.searchParams.get("diagnostics") === "true",
      "chat Export Diagnostics route",
    );
    await expectText(page, "Export");
    await page.goto(`${baseUrl}/chat`, { waitUntil: "networkidle" });
    await expectText(page, "Chat Readiness");
    await settleSidebarIndexState(page);
  }
}

async function runChatSmoke(page, baseUrl) {
  const status = await jsonFetch(baseUrl, "/api/chat/status");
  await page.goto(`${baseUrl}/chat`, { waitUntil: "networkidle" });
  await expectText(page, "Chat Readiness");
  await page
    .locator(".chat-suggestion-button")
    .first()
    .waitFor({ state: "visible", timeout: 15000 })
    .catch(() => undefined);
  const suggestions = await page
    .locator(".chat-suggestion-button")
    .evaluateAll((buttons) => buttons.map((button) => button.textContent?.trim() ?? ""));
  for (const suggestion of suggestions.filter(Boolean)) {
    await clickButton(page, suggestion);
    await expectText(page, suggestion);
  }

  if (status.canSend && liveChatMode) {
    const rebuildButton = page.getByRole("button", {
      name: "Rebuild Index",
      exact: true,
    });
    const firstRebuildButton = rebuildButton.first();
    if (
      (await rebuildButton.count()) > 0 &&
      (await firstRebuildButton.isVisible()) &&
      !(await locatorIsDisabled(firstRebuildButton))
    ) {
      await clickButton(page, "Rebuild Index", { timeout: 60000 });
      await expectText(page, "Ready");
    }
    await page.locator("textarea").fill(
      "Use the release readiness smoke skill. What exact phrase proves this workspace is indexed?",
    );
    await clickButton(page, "^Send( anyway)?$", { exact: false });
    await expectText(page, "Skill Workshop V1 release candidate is ready.");
    await assertInteractiveControlsAccessible(page, "Chat");
    return;
  }

  if (status.canSend) {
    await page.locator("textarea").fill("");
    await waitForButtonHidden(page, "Send anyway");
    await expectText(page, "Ready");
    await verifyChatDiagnosticsLink(page, baseUrl);
    await markVisibleButtonsCoveredByLabel(page, ["Rebuild Index"]);
    await markChatReadinessLinksCovered(page);
    await assertVisibleButtonsAccountedFor(page, "Chat");
    await assertVisibleLinksAccountedFor(page, "Chat");
    await assertInteractiveControlsAccessible(page, "Chat");
    return;
  }

  const text = documentText(await page.content());
  assert(
    text.includes("Settings") || text.includes("Rebuild"),
    "Blocked chat state did not show an actionable path",
  );
  await verifyChatDiagnosticsLink(page, baseUrl);
  await markVisibleButtonsCoveredByLabel(page, ["Rebuild Index"]);
  await markChatReadinessLinksCovered(page);
  await assertVisibleButtonsAccountedFor(page, "Chat");
  await assertVisibleLinksAccountedFor(page, "Chat");
  await assertInteractiveControlsAccessible(page, "Chat");
}

function mockChatStatusPayload() {
  return {
    provider: "anthropic_api",
    runtimeSource: "runtime",
    canSend: true,
    blockingReason: null,
    suggestedAction: null,
    claudeCliEnabled: false,
    suggestedQuestions: ["What should I test in smoke chat?"],
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

function mockStaleChatStatusPayload(status = "stale") {
  return {
    ...mockChatStatusPayload(),
    suggestedAction: "Rebuild Index to refresh citations.",
    index: {
      status,
      skillCount: 1,
      chunkCount: 2,
      staleReason:
        status === "stale" ? "Smoke test changed the index state." : null,
      error: null,
    },
  };
}

function mockChatStreamBody(kind) {
  const citations = {
    type: "citations",
    sources: [
      {
        skillName: "release-readiness-smoke",
        section: "1-8",
        score: 0.91,
        preview: "Mock citation preview for chat UI smoke.",
      },
    ],
  };

  if (kind === "error") {
    return [
      JSON.stringify(citations),
      JSON.stringify({ type: "error", message: "Mock provider failure" }),
      "",
    ].join("\n");
  }

  return [
    JSON.stringify(citations),
    JSON.stringify({ type: "text", text: "Mock assistant " }),
    JSON.stringify({ type: "text", text: "response." }),
    "",
  ].join("\n");
}

async function openFirstChatCitationPreview(page) {
  const citationButton = page
    .getByRole("button", { name: /Show citation preview/i })
    .first();
  await citationButton.waitFor({ state: "visible", timeout: 15000 });
  await markButtonLocatorCovered(citationButton);
  await citationButton.click();
  const expandedCitationButton = page
    .getByRole("button", { name: /Hide citation preview/i })
    .first();
  await expandedCitationButton.waitFor({ state: "visible", timeout: 15000 });
  await markButtonLocatorCovered(expandedCitationButton);
  await expectText(page, "Mock citation preview for chat UI smoke.");
  await expectText(page, "Open source skill");
}

async function runMockedChatInteractionSmoke(page, baseUrl) {
  let chatRequestCount = 0;

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
    chatRequestCount += 1;
    await route.fulfill({
      contentType: "text/event-stream",
      body: mockChatStreamBody(chatRequestCount === 2 ? "error" : "success"),
    });
  });

  try {
    await page.goto(`${baseUrl}/chat`, { waitUntil: "networkidle" });
    await expectText(page, "Ready");

    const chatInput = page.locator("textarea");
    await chatInput.fill("Mock successful chat request");
    await chatInput.press("Shift+Enter");
    await chatInput.type("sent from keyboard");
    assert(
      (await chatInput.inputValue()).includes("\n"),
      "Chat Shift+Enter did not insert a newline",
    );
    await chatInput.press("Enter");
    await expectText(page, "Mock assistant response.");
    await expectText(page, "release-readiness-smoke");
    await openFirstChatCitationPreview(page);

    await clickButton(page, "Copy assistant message");
    await expectText(page, "Copied");
    const copiedText = await page.evaluate(() => window.__smokeCopiedText);
    assert(
      copiedText === "Mock assistant response.",
      "Chat Copy did not write the assistant message text",
    );

    await clickButton(page, "Clear");
    await expectText(page, "What should I test in smoke chat?");
    await clickButton(page, "What should I test in smoke chat?");
    await expectInputValue(
      page,
      "textarea",
      "What should I test in smoke chat?",
    );

    await page.locator("textarea").fill("Mock failed chat request");
    await clickButton(page, "Send");
    await expectText(page, "Error: Mock provider failure");
    await clickButton(page, "Retry");
    await expectText(page, "Mock assistant response.");
    await openFirstChatCitationPreview(page);

    await clickAllButtons(page, ".chat-message-action");
    await expectText(page, "Copied");
    await markVisibleButtonsCoveredByLabel(page, ["Rebuild Index", "Clear"]);
    await assertVisibleButtonsAccountedFor(page, "Mocked Chat");
    const sourceSkillLink = page
      .getByRole("link", { name: "Open source skill", exact: true })
      .first();
    await markLinkLocatorCovered(sourceSkillLink);
    await markChatReadinessLinksCovered(page);
    await assertVisibleLinksAccountedFor(page, "Mocked Chat");
    await assertInteractiveControlsAccessible(page, "Mocked Chat");
    await sourceSkillLink.click();
    await waitForPageUrl(
      page,
      (url) => url.pathname === "/editor/release-readiness-smoke",
      "chat source skill route",
    );
    await expectText(page, "release-readiness-smoke.md");
  } finally {
    await page.unroute("**/api/chat/status");
    await page.unroute("**/api/chat");
  }
}

async function runMockedChatClipboardFailureSmoke(browser, browserIssues, baseUrl) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultNavigationTimeout(90000);
  page.setDefaultTimeout(60000);
  attachBrowserIssueTracking(page, browserIssues);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new DOMException("Clipboard blocked by smoke test", "NotAllowedError");
        },
      },
    });
    document.execCommand = () => false;
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
      body: mockChatStreamBody("success"),
    });
  });

  try {
    await page.goto(`${baseUrl}/chat`, { waitUntil: "networkidle" });
    await expectText(page, "Ready");
    await page.locator("textarea").fill("Mock clipboard failure request");
    await clickButton(page, "Send");
    await expectText(page, "Mock assistant response.");
    await clickButton(page, "Copy assistant message");
    await expectText(page, "Copy failed. Select the message text manually.");
    await assertInteractiveControlsAccessible(page, "Mocked Chat Clipboard Failure");
  } finally {
    await page.close();
  }
}

async function runMockedChatReadinessFailureSmoke(page, baseUrl) {
  await page.route("**/api/chat/status", async (route) => {
    expectBrowserIssue(/http 500: .*\/api\/chat\/status$/);
    expectBrowserIssue(
      /console: Failed to load resource: the server responded with a status of 500/,
    );
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Smoke chat status failed." }),
    });
  });

  await page.route("**/api/release/readiness", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        summary: {
          status: "blocked",
          topAction: "Open Settings.",
          canExportDiagnostics: true,
        },
      }),
    });
  });

  try {
    await page.goto(`${baseUrl}/chat`, { waitUntil: "networkidle" });
    await expectText(page, "Readiness unavailable");
    await expectText(page, "Smoke chat status failed.");
    await expectText(page, "Chat readiness is unavailable");
    const settingsLink = page
      .getByRole("link", { name: "Settings", exact: true })
      .first();
    const exportLink = page
      .getByRole("link", { name: "Export Diagnostics", exact: true })
      .first();
    await settingsLink.waitFor({ state: "visible", timeout: 15000 });
    await exportLink.waitFor({ state: "visible", timeout: 15000 });
    await markLinkLocatorCovered(settingsLink);
    await markLinkLocatorCovered(exportLink);
    const chatAlert = page.locator(".chat-alert").first();
    await assertVisibleButtonsAccountedFor(
      chatAlert,
      "Mocked Chat Readiness Failure",
    );
    await assertVisibleLinksAccountedFor(
      chatAlert,
      "Mocked Chat Readiness Failure",
    );
    await assertInteractiveControlsAccessible(
      chatAlert,
      "Mocked Chat Readiness Failure",
    );
  } finally {
    await page.unroute("**/api/chat/status");
    await page.unroute("**/api/release/readiness");
  }
}

async function runMockedChatRebuildSmoke(page, baseUrl) {
  let indexRebuilt = false;

  await page.route("**/api/chat/status", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(
        indexRebuilt
          ? mockChatStatusPayload()
          : mockStaleChatStatusPayload("stale"),
      ),
    });
  });
  await page.route("**/api/release/readiness", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        summary: {
          status: indexRebuilt ? "ready" : "needs_action",
          topAction: indexRebuilt ? null : "Rebuild Index.",
          canExportDiagnostics: true,
        },
      }),
    });
  });
  await page.route("**/api/index", async (route) => {
    if (route.request().method() === "POST") {
      indexRebuilt = true;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        status: indexRebuilt ? "ready" : "stale",
        skillCount: 1,
        chunkCount: 2,
        staleReason: indexRebuilt ? null : "Smoke test changed the index state.",
      }),
    });
  });

  try {
    await page.goto(`${baseUrl}/chat`, { waitUntil: "networkidle" });
    await expectText(page, "Index stale");
    await clickButton(page, "Rebuild Index");
    await expectText(page, "Ready");
    assert(indexRebuilt, "Chat Rebuild Index did not call the index POST route");
    await clickButton(page, "What should I test in smoke chat?");
    await expectInputValue(
      page,
      "textarea",
      "What should I test in smoke chat?",
    );
    await page.locator("textarea").fill("");
    await waitForButtonHidden(page, "Send anyway");
    await markVisibleButtonsCoveredByLabel(page, ["Rebuild Index"]);
    await markChatReadinessLinksCovered(page);
    await assertVisibleButtonsAccountedFor(page, "Mocked Chat Rebuild");
    await assertVisibleLinksAccountedFor(page, "Mocked Chat Rebuild");
    await assertInteractiveControlsAccessible(page, "Mocked Chat Rebuild");
  } finally {
    await page.unroute("**/api/chat/status");
    await page.unroute("**/api/release/readiness");
    await page.unroute("**/api/index");
  }
}

async function verifyExportReadinessSectionLink(
  page,
  baseUrl,
  label,
  urlPredicate,
  expectedText,
) {
  const exportReadinessPanel = page.locator(".export-readiness").first();
  await exportReadinessPanel.waitFor({ state: "visible", timeout: 10000 });
  const link = exportReadinessPanel
    .locator("a.export-readiness-section-action")
    .filter({ hasText: label })
    .first();
  await link.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
  if ((await link.count()) === 0 || !(await link.isVisible())) return;

  await markLinkLocatorCovered(link);
  await link.click();
  await waitForPageUrl(page, urlPredicate, `export readiness ${label} route`);
  await expectText(page, expectedText);
  await gotoAndExpectText(
    page,
    `${baseUrl}/export`,
    "Export",
    `export readiness ${label} return route`,
  );
}

async function verifyExportReadinessSectionLinks(page, baseUrl) {
  await verifyExportReadinessSectionLink(
    page,
    baseUrl,
    "Rebuild Index",
    (url) => url.pathname === "/settings",
    "Setup Doctor",
  );
  await verifyExportReadinessSectionLink(
    page,
    baseUrl,
    "Open Export",
    (url) =>
      url.pathname === "/export" &&
      url.searchParams.get("diagnostics") === "true",
    "Export",
  );
}

async function markExportReadinessLinksCovered(page) {
  await markVisibleLinksCoveredByLabel(
    page,
    ["Open Settings", "Open Export", "Rebuild Index"],
    { requireAll: false },
  );
  await markVisibleLinksCoveredByHref(
    page,
    ["/settings", "/export?diagnostics=true"],
    { requireAll: false },
  );
}

async function runExportSmoke(page, baseUrl, smokeRoot) {
  await gotoAndExpectText(page, `${baseUrl}/export`, "Export", "export smoke");
  await verifyExportReadinessSectionLinks(page, baseUrl);
  await clickButton(page, "Select all");
  await clickButton(page, "Clear");
  await expectText(page, "0 of", "export selection cleared");
  await clickButton(page, "Select all");
  const singleDownloadPromise = page.waitForEvent("download");
  await clickButton(page, "Download .md");
  const singleDownload = await singleDownloadPromise;
  const singleDownloadPath = path.join(smokeRoot, "single-skill.md");
  await singleDownload.saveAs(singleDownloadPath);
  const singleDownloadText = await readFile(singleDownloadPath, "utf8");
  assert(
    singleDownloadText.includes("Skill Workshop V1 release candidate is ready."),
    "Single-skill browser export did not include the expected demo skill content",
  );
  assertNoUnsafe("single-skill browser export", singleDownloadText);
  const downloadPromise = page.waitForEvent("download");
  await clickButton(page, "Download Selected \\+ Diagnostics", { exact: false });
  const download = await downloadPromise;
  const downloadPath = path.join(smokeRoot, "downloaded-skills.zip");
  await download.saveAs(downloadPath);
  assert(await exists(downloadPath), "ZIP download was not saved");
  assertDiagnosticsZipEntries(
    extractZipEntries(await readFile(downloadPath)),
    "selected export ZIP",
  );
  const allDownloadPromise = page.waitForEvent("download");
  await clickButton(page, "Download All \\+ Diagnostics", { exact: false });
  const allDownload = await allDownloadPromise;
  const allDownloadPath = path.join(smokeRoot, "downloaded-all-skills.zip");
  await allDownload.saveAs(allDownloadPath);
  assert(await exists(allDownloadPath), "All-skills ZIP download was not saved");
  assertDiagnosticsZipEntries(
    extractZipEntries(await readFile(allDownloadPath)),
    "all-skills export ZIP",
  );
  await verifyExportReadinessSectionLinks(page, baseUrl);
  await waitForEnabledButton(page, "Select all");
  const selectAllAfterReadinessLinks = page
    .getByRole("button", { name: "Select all", exact: true })
    .first();
  if (
    (await selectAllAfterReadinessLinks.count()) > 0 &&
    (await selectAllAfterReadinessLinks.isVisible()) &&
    !(await locatorIsDisabled(selectAllAfterReadinessLinks))
  ) {
    await clickButton(page, "Select all");
  }
  await settleSidebarIndexState(page);
  await markVisibleButtonsCoveredByLabel(page, [
    "Rebuild Index",
    "Download All + Diagnostics",
    "Export Diagnostics",
    "Select all",
    "Clear",
    "Download .md",
  ]);
  await page.locator("button").evaluateAll((buttons) => {
    for (const button of buttons) {
      const label = (button.innerText || "").replace(/\s+/g, " ").trim();
      const visible = Boolean(
        button.offsetWidth ||
          button.offsetHeight ||
          button.getClientRects().length,
      );
      if (visible && /^Download Selected \+ Diagnostics/.test(label)) {
        button.__smokeCovered = true;
      }
    }
  });
  await markAppRouteLinksCovered(page, [
    "Open Settings",
    "Open Export",
    "Rebuild Index",
  ]);
  await assertVisibleButtonsAccountedFor(page, "Export");
  await markExportReadinessLinksCovered(page);
  await assertVisibleLinksAccountedFor(page, "Export");
  await assertInteractiveControlsAccessible(page, "Export");
}

async function runMockedEditorSaveFailureSmoke(page, baseUrl) {
  await page.route("**/api/skills", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    expectBrowserIssue(/http 500: .*\/api\/skills$/);
    expectBrowserIssue(
      /console: Failed to load resource: the server responded with a status of 500/,
    );
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        error: "Smoke editor save failed.",
        validationErrors: [
          {
            field: "name",
            code: "smoke_server_validation",
            message: "Smoke server validation failed.",
          },
        ],
      }),
    });
  });

  try {
    await page.goto(`${baseUrl}/editor`, { waitUntil: "networkidle" });
    await expectText(page, "Template Gallery");
    await clickButton(page, "Workflow Skill", { exact: false });
    await page
      .locator("input[placeholder='my-skill-name']")
      .fill("browser-smoke-server-failure");
    await page
      .locator("input[placeholder='What does this skill do?']")
      .fill("Used to verify server-side save failure handling.");
    await page.locator("input[placeholder='git, pr, review']").fill("smoke, qa");
    await clickButton(page, "Save changes");
    await expectText(page, "Smoke editor save failed.");
    await expectText(page, "Smoke server validation failed.");
    assert(
      new URL(page.url()).pathname === "/editor",
      "Editor save failure should not navigate to a skill page",
    );
    await assertInteractiveControlsAccessible(page, "Mocked Editor Save Failure");
  } finally {
    await page.unroute("**/api/skills");
  }
}

async function runEditorSmoke(page, baseUrl) {
  await page.goto(`${baseUrl}/editor`, { waitUntil: "networkidle" });
  await expectText(page, "Template Gallery");
  await clickButton(page, "Workflow Skill", { exact: false });
  await page.locator("input[placeholder='my-skill-name']").fill("browser-smoke-skill");
  await page
    .locator("input[placeholder='What does this skill do?']")
    .fill("Used to verify the local smoke runner editor save path.");
  await page.locator("input[placeholder='git, pr, review']").fill("smoke, qa");
  const editorBody = page.getByLabel("Skill markdown body");
  await editorBody.fill(
    "## Custom Draft\n\nThis custom body should survive Keep draft.",
  );
  await clickButton(page, "Reference Skill", { exact: false });
  await expectText(page, "Apply Reference Skill template?");
  await clickButton(page, "Keep draft");
  await waitForLocatorInputValue(
    editorBody,
    "## Custom Draft\n\nThis custom body should survive Keep draft.",
    "Template Keep draft should preserve the custom body",
  );
  await clickButton(page, "Reference Skill", { exact: false });
  await expectText(page, "Apply Reference Skill template?");
  await clickButton(page, "Apply template");
  await waitForLocatorInputValue(
    editorBody,
    "## Purpose\n\nUse this skill when the user needs reliable reference material about a focused topic.\n\n## Source Notes\n\n- Add the canonical source or folder this skill summarizes.\n- Keep examples short and concrete.\n- Prefer stable facts over broad commentary.\n\n## Answering Guidance\n\n- Cite the relevant section when responding.\n- Say when the answer is not covered by this reference.\n",
    "Template Apply should replace the custom body",
  );
  const editTab = page.getByRole("tab", { name: "Edit", exact: true }).first();
  const previewTab = page
    .getByRole("tab", { name: "Mobile Preview", exact: true })
    .first();
  await editTab.focus();
  await assertLocatorFocused(editTab, "Editor Edit tab");
  await editTab.press("ArrowRight");
  await assertLocatorFocused(previewTab, "Editor Mobile Preview tab");
  assert(
    (await previewTab.getAttribute("aria-selected")) === "true",
    "Editor ArrowRight did not select the Mobile Preview tab",
  );
  await previewTab.press("Home");
  await assertLocatorFocused(editTab, "Editor Edit tab after Home");
  assert(
    (await editTab.getAttribute("aria-selected")) === "true",
    "Editor Home key did not return to the Edit tab",
  );
  await clickButton(page, "Save changes");
  await waitForPageUrl(
    page,
    (url) => url.pathname === "/editor/browser-smoke-skill",
    "editor save route",
  );
  await expectText(page, "Edit: browser-smoke-skill.md");
  await markVisibleButtonsCoveredByLabel(page, [
    "Rebuild Index",
    "Cancel",
    "Edit",
    "Mobile Preview",
  ]);
  await markAppRouteLinksCovered(page);
  await assertVisibleButtonsAccountedFor(page, "Editor");
  await assertVisibleLinksAccountedFor(page, "Editor");
  await assertInteractiveControlsAccessible(page, "Editor");

  await page.goto(`${baseUrl}/editor`, { waitUntil: "networkidle" });
  await clickButton(page, "Reference Skill", { exact: false });
  await page.locator("input[placeholder='my-skill-name']").fill("discard-browser-smoke");
  await clickButton(page, "Cancel");
  await expectText(page, "Discard unsaved changes?");
  await clickButton(page, "Stay");
  await clickButton(page, "Cancel");
  await clickButton(page, "Discard");
  await waitForPageUrl(
    page,
    (url) => url.pathname === "/skills",
    "editor discard route",
  );
}

async function runGuidedAutosaveClearSmoke(page) {
  const purposeInput = page.locator("#guided-purpose");
  await purposeInput.fill("Temporary autosave draft for clear smoke.");
  await clickButton(page, "Clear draft");
  await expectText(page, "This clears the guided draft from this browser tab.");
  await clickButton(page, "Cancel");
  assert(
    (await purposeInput.inputValue()) === "Temporary autosave draft for clear smoke.",
    "Guided clear cancel did not preserve the draft",
  );

  await clickButton(page, "Clear draft");
  const confirmGroup = page.getByRole("group", {
    name: "Confirm clear guided draft",
  });
  await clickButtonIn(confirmGroup, "Clear draft");
  await expectText(page, "Draft cleared from this tab.");
  assert((await purposeInput.inputValue()) === "", "Guided clear did not reset the form");
}

async function runGuidedSmoke(page, baseUrl) {
  await page.goto(`${baseUrl}/editor/guided`, { waitUntil: "networkidle" });
  await runGuidedAutosaveClearSmoke(page);
  const firstStepButton = page
    .getByRole("button", { name: /Step 1 of 4: Purpose, current step\./i })
    .first();
  await firstStepButton.focus();
  await assertLocatorFocused(firstStepButton, "Guided first step button");
  await firstStepButton.press("End");
  await assertActiveElementLabel(
    page,
    /Step 4 of 4: Review, current step\./i,
    "Guided End key step navigation",
  );
  await page.keyboard.press("Home");
  await assertActiveElementLabel(
    page,
    /Step 1 of 4: Purpose, current step\./i,
    "Guided Home key step navigation",
  );
  await page.locator("#guided-template").waitFor({
    state: "visible",
    timeout: 15000,
  });
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll("#guided-template option")).some(
      (option) => option.value === "learning-rubric",
    ),
  );
  await page.locator("#guided-template").selectOption("learning-rubric");
  await setInputValue(
    page,
    "#guided-purpose",
    "Help release owners turn local readiness evidence into a concise release decision.",
  );
  await setInputValue(
    page,
    "#guided-audience",
    "Solo developers preparing a local Claude-first RAG tool for first users.",
  );
  await clickButton(page, "Next");
  await setInputValue(
    page,
    "#guided-trigger-examples",
    "Summarize readiness blockers before I ship.\nTurn diagnostics findings into release notes.",
  );
  await setInputValue(
    page,
    "#guided-required-inputs",
    "Setup Doctor summary\nRelease readiness panel\nDiagnostics export notes",
  );
  await clickButton(page, "Next");
  await setInputValue(
    page,
    "#guided-boundaries",
    "Do not invent test evidence that was not run.\nDo not expose local paths, account names, or tokens.",
  );
  await setInputValue(
    page,
    "#guided-success-criteria",
    "The answer separates verified evidence from remaining blockers.\nThe final recommendation names the next concrete action.",
  );
  await clickButton(page, "Next");
  await clickButton(page, "Review Draft");
  await expectText(page, "Rubric score");
  await clickButton(page, "Build Draft");
  await expectText(page, "Draft preview");
  await clickButton(page, "1 Purpose");
  await clickButton(page, "2 Examples");
  await clickButton(page, "3 Boundaries");
  await clickButton(page, "4 Review");
  await clickAllButtons(page, ".guided-checklist-item");
  await clickButton(page, "4 Review");
  await clickButton(page, "Back");
  await clickButton(page, "Next");
  await markButtonLocatorCovered(
    page.getByRole("button", { name: "Open in Editor", exact: true }).first(),
  );
  await markVisibleButtonsCoveredByLabel(page, [
    "Rebuild Index",
    "Review Draft",
    "Build Draft",
  ]);
  await markAppRouteLinksCovered(page);
  await assertVisibleButtonsAccountedFor(page, "Guided Builder");
  await assertVisibleLinksAccountedFor(page, "Guided Builder");
  await assertInteractiveControlsAccessible(page, "Guided Builder");
  await clickButton(page, "Open in Editor");
  await waitForPageUrl(
    page,
    (url) => url.pathname === "/editor" && url.searchParams.get("guidedDraft") === "1",
    "guided Open in Editor route",
  );
  await expectText(page, "release owners");
}

async function runMobileLayoutSmoke(page, baseUrl) {
  const originalViewport = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });

  const routes = [
    { path: "/settings", text: "V1 Release Readiness" },
    { path: "/skills", text: "Library Readiness" },
    { path: "/chat", text: "Chat Readiness" },
    { path: "/export", text: "Export" },
    { path: "/editor", text: "Template Gallery" },
    { path: "/editor/guided", text: "Guided Skill Builder" },
  ];

  for (const route of routes) {
    const stopIgnoringReloadIssues =
      route.path === "/settings" ? ignoreKnownNextDevReloadIssues() : () => {};
    try {
      await gotoAndExpectText(
        page,
        `${baseUrl}${route.path}`,
        route.text,
        `mobile ${route.path}`,
      );
      await assertNoHorizontalPageOverflow(page, `Mobile ${route.path}`);
      await assertInteractiveControlsAccessible(page, `Mobile ${route.path}`);
    } finally {
      stopIgnoringReloadIssues();
    }
  }

  if (originalViewport) {
    await page.setViewportSize(originalViewport);
  }
}

function attachBrowserIssueTracking(page, browserIssues) {
  page.on("pageerror", (error) => {
    const stack = error.stack || error.message;
    const issue = `pageerror: ${stack}`;
    if (!consumeExpectedBrowserIssue(issue)) browserIssues.push(issue);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      const issue = `console: ${message.text()}`;
      if (!consumeExpectedBrowserIssue(issue)) browserIssues.push(issue);
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 500) {
      const issue = `http ${response.status()}: ${response.url()}`;
      if (!consumeExpectedBrowserIssue(issue)) browserIssues.push(issue);
    }
  });
}

async function runSettingsManualQaBlockedStorageSmoke(browser, browserIssues, baseUrl) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
  page.setDefaultNavigationTimeout(90000);
  page.setDefaultTimeout(60000);
  attachBrowserIssueTracking(page, browserIssues);
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage blocked by smoke test", "SecurityError");
      },
    });
  });

  try {
    await gotoAndExpectText(
      page,
      `${baseUrl}/settings`,
      "Manual QA Evidence",
      "settings manual QA storage fallback",
    );
    const manualQaPanel = page.locator(".settings-manual-qa-panel").first();
    await manualQaPanel.waitFor({ state: "visible", timeout: 15000 });
    const manualQaItem = manualQaPanel.locator(".settings-manual-qa-item").first();
    await manualQaItem.waitFor({ state: "visible", timeout: 15000 });
    await expectText(
      page,
      "Browser storage is unavailable, so evidence is kept in memory for this page only.",
    );
    await page
      .locator("#settings-workspace-profile-name")
      .fill("Blocked Storage Smoke");
    await clickButton(page, "Save Current");
    await expectText(
      page,
      "Workspace profile is available in this tab, but browser storage is unavailable.",
    );
    await clickButton(page, "Dismiss", { timeout: 1000 }).catch(() => undefined);
    await setManualQaItemStatus(manualQaItem, "Mark Passed", "Passed");
    await setManualQaItemStatus(manualQaItem, "Needs Fix", "Needs fix");
    await setManualQaItemStatus(manualQaItem, "Reset", "Pending");
    await assertInteractiveControlsAccessible(
      page,
      "Settings Manual QA blocked storage",
    );
  } finally {
    await page.close();
  }
}

async function runGuidedBlockedSessionStorageSmoke(browser, browserIssues, baseUrl) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
  page.setDefaultNavigationTimeout(90000);
  page.setDefaultTimeout(60000);
  attachBrowserIssueTracking(page, browserIssues);
  await page.addInitScript(() => {
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      value: {
        getItem() {
          throw new DOMException(
            "Session storage blocked by smoke test",
            "SecurityError",
          );
        },
        setItem() {
          throw new DOMException(
            "Session storage blocked by smoke test",
            "SecurityError",
          );
        },
        removeItem() {
          throw new DOMException(
            "Session storage blocked by smoke test",
            "SecurityError",
          );
        },
      },
    });
  });

  try {
    await gotoAndExpectText(
      page,
      `${baseUrl}/editor/guided`,
      "Guided Skill Builder",
      "guided builder session storage fallback",
    );
    await expectText(page, "Autosave is unavailable in this browser session.");
    await page.locator("#guided-template").waitFor({
      state: "visible",
      timeout: 15000,
    });
    await page.locator("#guided-template").selectOption("learning-rubric");
    await setInputValue(
      page,
      "#guided-purpose",
      "Verify guided builder remains usable when browser session storage is blocked.",
    );
    await setInputValue(
      page,
      "#guided-audience",
      "Local release owners testing private browser storage behavior.",
    );
    await clickButton(page, "Next");
    await setInputValue(
      page,
      "#guided-trigger-examples",
      "Create a skill without relying on browser storage.\nExplain storage fallback behavior.",
    );
    await setInputValue(
      page,
      "#guided-required-inputs",
      "Current readiness panel\nManual QA Evidence panel",
    );
    await clickButton(page, "Next");
    await setInputValue(
      page,
      "#guided-boundaries",
      "Do not assume browser session storage is available.",
    );
    await setInputValue(
      page,
      "#guided-success-criteria",
      "The builder shows an actionable handoff failure instead of crashing.",
    );
    await clickButton(page, "Next");
    await clickButton(page, "Review Draft");
    await expectText(page, "Rubric score");
    await clickButton(page, "Build Draft");
    await expectText(page, "Draft preview");
    await clickButton(page, "Open in Editor");
    await expectText(
      page,
      "Browser storage is unavailable, so the draft cannot be handed off to the editor in this tab.",
    );
    assert(
      new URL(page.url()).pathname === "/editor/guided",
      "Guided builder should stay on the page when storage handoff is unavailable",
    );
    await assertInteractiveControlsAccessible(
      page,
      "Guided Builder blocked session storage",
    );
  } finally {
    await page.close();
  }
}

async function runBrowserSmoke(baseUrl, smokeRoot, importSource, archivePath) {
  expectedBrowserIssuePatterns.length = 0;
  const browser = await chromium.launch({
    headless: process.env.SMOKE_HEADLESS !== "false",
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultNavigationTimeout(90000);
  page.setDefaultTimeout(60000);
  const browserIssues = [];
  await page.addInitScript(() => {
    function disableNextDevOverlayPointerEvents() {
      if (!document.documentElement) return;
      if (document.getElementById("smoke-next-dev-overlay-style")) return;
      const style = document.createElement("style");
      style.id = "smoke-next-dev-overlay-style";
      style.textContent =
        "nextjs-portal,[data-nextjs-dev-overlay]{pointer-events:none!important;}";
      document.documentElement.appendChild(style);
    }

    disableNextDevOverlayPointerEvents();
    document.addEventListener(
      "DOMContentLoaded",
      disableNextDevOverlayPointerEvents,
      { once: true },
    );
  });
  attachBrowserIssueTracking(page, browserIssues);

  try {
    await runNavigationSmoke(page, baseUrl);
    await runKeyboardNavigationSmoke(page, baseUrl);
    await runMockedSettingsReleaseActionsSmoke(page, baseUrl);
    await runMockedSettingsClaudeActionsSmoke(page, baseUrl);
    await runSettingsSmoke(
      page,
      baseUrl,
      path.join(smokeRoot, "workspace"),
      path.join(smokeRoot, "smoke-settings.env"),
    );
    await runMockedSkillsImportFailureSmoke(page, baseUrl);
    await runMockedSkillsImportDuplicateSmoke(page, baseUrl);
    await runSkillsSmoke(page, baseUrl, importSource, archivePath);
    await runMockedEmptyStateSmoke(page, baseUrl, smokeRoot);
    await runChatSmoke(page, baseUrl);
    await runMockedChatInteractionSmoke(page, baseUrl);
    await runMockedChatClipboardFailureSmoke(browser, browserIssues, baseUrl);
    await runMockedChatReadinessFailureSmoke(page, baseUrl);
    await runMockedChatRebuildSmoke(page, baseUrl);
    await runExportSmoke(page, baseUrl, smokeRoot);
    await runMockedEditorSaveFailureSmoke(page, baseUrl);
    await runEditorSmoke(page, baseUrl);
    await runGuidedSmoke(page, baseUrl);
    await runMobileLayoutSmoke(page, baseUrl);
    await runSettingsManualQaBlockedStorageSmoke(browser, browserIssues, baseUrl);
    await runGuidedBlockedSessionStorageSmoke(browser, browserIssues, baseUrl);
    assert(browserIssues.length === 0, `Browser issues:\n${browserIssues.join("\n")}`);
    assertExpectedBrowserIssuesConsumed();
  } finally {
    await browser.close();
  }
}

async function main() {
  assert(await exists(demoWorkspace), "examples/demo-workspace was not found.");
  const originalEnvLocal = await readOptionalText(envLocalPath);
  await mkdir(localWorkspaceRoot, { recursive: true });

  const runRoot = path.join(localWorkspaceRoot, `smoke-local-${stamp()}`);
  const workspace = path.join(runRoot, "workspace");
  const importSource = path.join(runRoot, "import-source");
  const archivePath = path.join(runRoot, "smoke-archive-skills.zip");
  const settingsImportPath = path.join(runRoot, "smoke-settings.env");
  await cp(demoWorkspace, workspace, { recursive: true });
  await mkdir(path.join(workspace, "smoke-picker-child"), { recursive: true });
  await mkdir(importSource, { recursive: true });
  await writeFile(
    settingsImportPath,
    "NEXT_PUBLIC_APP_TITLE=Smoke Imported Settings\n",
    "utf8",
  );
  await writeFile(
    path.join(importSource, "smoke-imported-skill.md"),
    `---\ndescription: Imported by the local smoke runner to verify import, delete, and restore flows.\ntags:\n  - smoke\n  - qa\nwhen_to_use: Use only during local smoke testing.\n---\n\n# Smoke Imported Skill\n\nUse this fixture to verify import preview, apply, delete, and restore flows in a temporary workspace.\n`,
    "utf8",
  );
  await writeFile(
    archivePath,
    createZip({
      "skills/smoke-zip-imported-skill.md": [
        "---",
        "description: Imported from a zip archive by the local smoke runner.",
        "tags:",
        "  - smoke",
        "  - archive",
        "when_to_use: Use only during local smoke testing of zip archive imports.",
        "---",
        "",
        "# Smoke Zip Imported Skill",
        "",
        "Use this fixture to verify zip archive preview and import without touching real workspace files.",
      ].join("\n"),
    }),
  );
  await writeFile(
    envLocalPath,
    buildSmokeEnvLocal(workspace),
    "utf8",
  );

  const port = Number(process.env.SMOKE_PORT) || (await getFreePort());
  const baseUrl = `http://127.0.0.1:${port}`;
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  const logs = [];
  const child = spawn(
    process.execPath,
    [nextBin, "dev", "--webpack", "-H", "127.0.0.1", "-p", String(port)],
    {
      cwd: root,
      env: {
        ...process.env,
        WORKSPACE_ROOT: workspace,
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
    await runApiSmoke(baseUrl, workspace);
    await runBrowserSmoke(baseUrl, runRoot, importSource, archivePath);
    console.log(`Local smoke passed at ${baseUrl}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    console.error("\nRecent server output:");
    console.error(logs.join("\n"));
    process.exitCode = 1;
  } finally {
    child.kill("SIGTERM");
    await delay(500);
    if (!child.killed && child.exitCode === null) child.kill("SIGKILL");
    if (!keepWorkspace) {
      const relativeRunRoot = path.relative(localWorkspaceRoot, runRoot);
      if (!relativeRunRoot.startsWith("..") && relativeRunRoot !== "") {
        await rm(runRoot, { recursive: true, force: true });
      }
    } else {
      console.log(`Smoke workspace preserved: ${runRoot}`);
    }
    await restoreOptionalText(envLocalPath, originalEnvLocal);
  }
}

await main();
