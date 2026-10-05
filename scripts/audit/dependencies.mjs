import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const BLOCKED_SEVERITIES = new Set(["moderate", "high", "critical"]);
const ACCEPTED_ADVISORIES = new Map([
  [
    "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm",
    "braces has no patched release; every installed path is development-only through Tailwind or ESLint and receives only repository-controlled glob patterns",
  ],
]);

export function analyzeAudit(report) {
  const vulnerabilities = report.vulnerabilities ?? {};
  const acceptedCache = new Map();

  function isAcceptedChain(name, visiting = new Set()) {
    if (acceptedCache.has(name)) return acceptedCache.get(name);
    if (visiting.has(name)) return false;

    const vulnerability = vulnerabilities[name];
    if (!vulnerability || !BLOCKED_SEVERITIES.has(vulnerability.severity)) {
      return false;
    }

    const nextVisiting = new Set(visiting).add(name);
    const blockingCauses = (vulnerability.via ?? []).filter((cause) =>
      typeof cause === "string"
        ? BLOCKED_SEVERITIES.has(vulnerabilities[cause]?.severity)
        : BLOCKED_SEVERITIES.has(cause?.severity),
    );
    const accepted =
      blockingCauses.length > 0 &&
      blockingCauses.every((cause) =>
        typeof cause === "string"
          ? isAcceptedChain(cause, nextVisiting)
          : ACCEPTED_ADVISORIES.has(cause.url),
      );

    acceptedCache.set(name, accepted);
    return accepted;
  }

  const blocked = [];
  const accepted = [];
  for (const [name, vulnerability] of Object.entries(vulnerabilities)) {
    if (!BLOCKED_SEVERITIES.has(vulnerability.severity)) continue;
    (isAcceptedChain(name) ? accepted : blocked).push({
      name,
      severity: vulnerability.severity,
    });
  }

  return { accepted, blocked };
}

function runNpmAudit(extraArgs = []) {
  const npmCli = process.env.npm_execpath;
  const command = npmCli ? process.execPath : "npm";
  const args = npmCli
    ? [npmCli, "audit", ...extraArgs, "--json"]
    : ["audit", ...extraArgs, "--json"];
  const result = spawnSync(command, args, {
    encoding: "utf8",
    windowsHide: true,
  });

  if (!result.stdout?.trim()) {
    throw new Error(
      ["npm audit did not return a JSON report.", result.error?.message, result.stderr]
        .filter(Boolean)
        .join("\n"),
    );
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(
      `npm audit returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function main() {
  const production = analyzeAudit(runNpmAudit(["--omit=dev"]));
  if (production.blocked.length > 0 || production.accepted.length > 0) {
    console.error("Production dependency advisories are never excepted:");
    for (const finding of [...production.blocked, ...production.accepted]) {
      console.error(`- ${finding.name} (${finding.severity})`);
    }
    process.exit(1);
  }

  const fullReport = runNpmAudit();
  const { accepted, blocked } = analyzeAudit(fullReport);
  if (blocked.length > 0) {
    console.error("Unaccepted dependency advisories:");
    for (const finding of blocked) {
      console.error(`- ${finding.name} (${finding.severity})`);
    }
    process.exit(1);
  }

  for (const finding of accepted) {
    console.warn(`Accepted development-only advisory chain: ${finding.name} (${finding.severity})`);
  }
  console.log(
    `Dependency audit passed: production dependencies clean; ${accepted.length} development package chain(s) covered by one documented, exact advisory exception.`,
  );
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
