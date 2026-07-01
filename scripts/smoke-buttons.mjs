import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";
import {
  getFreePort,
  pushLog,
  waitForServerReady,
} from "./lib/server-utils.mjs";

const routeNavigationTimeoutMs = 60000;
const routes = [
  "/settings",
  "/skills",
  "/chat",
  "/export",
  "/editor",
  "/editor/guided",
];
const expectedRouteText = new Map([
  ["/settings", "Manual QA Evidence"],
  ["/skills", "Library Readiness"],
  ["/chat", "Chat Readiness"],
  ["/export", "Export Skills"],
  ["/editor", "Template Gallery"],
  ["/editor/guided", "Guided Skill Builder"],
]);
const safeClickLimitPerRoute = 20;
const riskyButtonLabelPatterns = [
  /open login/i,
  /test cli/i,
  /choose folder/i,
  /browse/i,
  /^show$/i,
  /save/i,
  /delete/i,
  /remove/i,
  /restore/i,
  /^rebuild$/i,
  /rebuild index/i,
  /download/i,
  /export/i,
  /send/i,
  /retry/i,
  /import/i,
  /preview folder/i,
  /preview zip/i,
  /create skill/i,
  /use template/i,
  /start from template/i,
  /generate feedback/i,
  /copy/i,
  /^open\b/i,
  /^chat$/i,
  /^settings$/i,
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isRiskyButtonLabel(label) {
  if (!label) return true;
  return riskyButtonLabelPatterns.some((pattern) => pattern.test(label));
}

async function gotoRouteAndExpectText(page, baseUrl, route) {
  const expectedText = expectedRouteText.get(route);
  let lastBodyText = "";

  for (let attempt = 1; attempt <= 3; attempt++) {
    await page.goto(`${baseUrl}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: routeNavigationTimeoutMs,
    });
    await page.waitForLoadState("networkidle", {
      timeout: routeNavigationTimeoutMs,
    }).catch(() => {});

    if (!expectedText) return;

    const rendered = await page
      .getByText(expectedText, { exact: true })
      .first()
      .waitFor({ state: "visible", timeout: routeNavigationTimeoutMs / 3 })
      .then(() => true)
      .catch(async () => {
        lastBodyText = await page
          .locator("body")
          .innerText({ timeout: 15000 })
          .catch(() => "");
        return false;
      });

    if (rendered) return;
    await delay(1000 * attempt);
  }

  throw new Error(
    `${route} did not render expected app text: ${expectedText}. Body excerpt: ${lastBodyText
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240)}`,
  );
}

function startDevServer(port) {
  const logs = [];
  const child =
    process.platform === "win32"
      ? spawn(
          "cmd.exe",
          [
            "/d",
            "/s",
            "/c",
            `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
          ],
          {
            cwd: process.cwd(),
            env: process.env,
            stdio: ["ignore", "pipe", "pipe"],
            windowsHide: true,
          },
        )
      : spawn(
          "npm",
          ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port)],
          {
            cwd: process.cwd(),
            env: process.env,
            stdio: ["ignore", "pipe", "pipe"],
          },
        );

  child.stdout.on("data", (chunk) => pushLog(logs, chunk));
  child.stderr.on("data", (chunk) => pushLog(logs, chunk));
  return { child, logs };
}

function stopDevServer(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
    });
    return;
  }
  child.kill("SIGTERM");
}

function shouldIgnoreFailedRequest(request) {
  const failure = request.failure()?.errorText ?? "";
  if (
    request.url().includes("/__nextjs_original-stack-frames") &&
    /ERR_ABORTED/i.test(failure)
  ) {
    return true;
  }
  if (/ERR_ABORTED/i.test(failure) && request.method() === "GET") return true;
  if (/hot-update|webpack/.test(request.url()) && /ERR_ABORTED/i.test(failure)) {
    return true;
  }
  return false;
}

async function collectSafeButtons(page) {
  const buttons = await page.locator("button").evaluateAll((elements) =>
    elements.map((element, index) => ({
      index,
      text: (element.textContent ?? "").replace(/\s+/g, " ").trim(),
      disabled:
        element.disabled || element.getAttribute("aria-disabled") === "true",
      visible: Boolean(
        element.offsetWidth ||
          element.offsetHeight ||
          element.getClientRects().length,
      ),
    })),
  );
  const visibleButtons = buttons.filter((button) => button.visible);
  const safeButtons = visibleButtons.filter(
    (button) => !button.disabled && !isRiskyButtonLabel(button.text),
  );
  return { visibleButtons, safeButtons };
}

async function auditSafeButtonClick(page, baseUrl, route, label) {
  const consoleErrors = [];
  const failedRequests = [];
  const onConsole = (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  };
  const onPageError = (error) => {
    consoleErrors.push(error.message);
  };
  const onRequestFailed = (request) => {
    if (shouldIgnoreFailedRequest(request)) return;
    failedRequests.push(
      `${request.method()} ${request.url()} ${
        request.failure()?.errorText ?? ""
      }`,
    );
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("requestfailed", onRequestFailed);
  try {
    await gotoRouteAndExpectText(page, baseUrl, route);
    await page.waitForTimeout(1000);
    const locator = page.locator("button").filter({ hasText: label }).first();
    const visibleAtClickTime = await locator
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (!visibleAtClickTime) {
      return {
        route,
        button: label,
        skipped: true,
        reason: "Button was no longer visible after route reload.",
        consoleErrors,
        failedRequests,
        ok: consoleErrors.length === 0 && failedRequests.length === 0,
      };
    }
    await locator.click({ timeout: 15000 });
    await page.waitForTimeout(700);
    return {
      route,
      button: label,
      consoleErrors,
      failedRequests,
      ok: consoleErrors.length === 0 && failedRequests.length === 0,
    };
  } catch (error) {
    return {
      route,
      button: label,
      error: error instanceof Error ? error.message : String(error),
      consoleErrors,
      failedRequests,
      ok: false,
    };
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("requestfailed", onRequestFailed);
  }
}

async function auditRoute(page, baseUrl, route) {
  await gotoRouteAndExpectText(page, baseUrl, route);
  await page.waitForTimeout(1000);
  const { visibleButtons, safeButtons } = await collectSafeButtons(page);
  const selectedButtons = safeButtons.slice(0, safeClickLimitPerRoute);
  const findings = [];
  const clickResults = [];

  for (const button of selectedButtons) {
    const result = await auditSafeButtonClick(page, baseUrl, route, button.text);
    clickResults.push(result);
    if (!result.ok) findings.push(result);
  }

  const transientSkipped = clickResults.filter((result) => result.skipped).length;
  return {
    summary: {
      route,
      visibleButtons: visibleButtons.length,
      safeCandidates: selectedButtons.length,
      safeClicked: selectedButtons.length - transientSkipped,
      transientSkipped,
      skipped: visibleButtons.length - selectedButtons.length,
      safeLabels: selectedButtons.map((button) => button.text),
    },
    findings,
  };
}

async function main() {
  const providedBaseUrl = process.env.SMOKE_BUTTONS_BASE_URL;
  const port = providedBaseUrl ? null : await getFreePort();
  const baseUrl = providedBaseUrl ?? `http://127.0.0.1:${port}`;
  const server = providedBaseUrl ? null : startDevServer(port);
  let browser = null;

  try {
    if (server) {
      await waitForServerReady({
        baseUrl,
        child: server.child,
        logs: server.logs,
        probePath: "/settings",
        serverName: "dev server",
      });
    }
    browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
    });
    const routeSummaries = [];
    const findings = [];

    for (const route of routes) {
      const result = await auditRoute(page, baseUrl, route);
      routeSummaries.push(result.summary);
      findings.push(...result.findings);
    }

    console.log(
      JSON.stringify(
        {
          baseUrl,
          routeSummaries,
          findingCount: findings.length,
          findings,
        },
        null,
        2,
      ),
    );

    assert(
      findings.length === 0,
      `Safe button smoke found ${findings.length} issue(s).`,
    );
    console.log(`Safe button smoke passed at ${baseUrl}`);
  } finally {
    if (browser) await browser.close();
    if (server) stopDevServer(server.child);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
