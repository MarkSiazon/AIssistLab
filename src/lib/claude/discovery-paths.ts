import os from "node:os";
import path from "node:path";

function getHomePath(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): string {
  return env.USERPROFILE || env.HOME || os.homedir();
}

export function isWindowsLikePath(value: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(value) || value.includes("\\");
}

export function pathApiFor(value: string): path.PlatformPath {
  return isWindowsLikePath(value) ? path.win32 : path.posix;
}

export function joinNearHome(
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
  ...segments: string[]
): string {
  const home = getHomePath(env);
  return pathApiFor(home).join(home, ...segments);
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function expandEnvPrefix(
  value: string,
  token: string,
  replacement: string | undefined,
): string {
  if (!replacement) return value;
  return value.replace(
    new RegExp(`^${escapeRegExp(token)}(?=$|[\\\\/])`, "i"),
    replacement,
  );
}

export function expandUserPath(
  value: string,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const home = getHomePath(env);
  const homeValue = env.HOME || home;
  const userProfile = env.USERPROFILE || home;

  let expanded = trimmed.replace(/^~(?=$|[\\/])/, home);
  expanded = expandEnvPrefix(expanded, "%USERPROFILE%", userProfile);
  expanded = expandEnvPrefix(expanded, "$USERPROFILE", userProfile);
  expanded = expandEnvPrefix(expanded, "${USERPROFILE}", userProfile);
  expanded = expandEnvPrefix(expanded, "$HOME", homeValue);
  expanded = expandEnvPrefix(expanded, "${HOME}", homeValue);

  return expanded;
}

export function toPortableHomePath(
  value: string,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): string {
  const expanded = expandUserPath(value, env);
  const homeCandidates = [env.USERPROFILE, env.HOME, os.homedir()]
    .filter((candidate): candidate is string => Boolean(candidate))
    .map((candidate) => candidate.replace(/[\\/]+$/, ""));

  for (const home of homeCandidates) {
    if (!home) continue;
    const homeLower = home.toLowerCase();
    const valueLower = expanded.toLowerCase();
    if (valueLower === homeLower) return "~";
    if (
      valueLower.startsWith(`${homeLower}\\`) ||
      valueLower.startsWith(`${homeLower}/`)
    ) {
      return `~${expanded.slice(home.length)}`;
    }
  }

  return expanded;
}

export function sanitizeClaudeDisplayText(
  value: string,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): string {
  const homeCandidates = [env.USERPROFILE, env.HOME, os.homedir()]
    .filter((candidate): candidate is string => Boolean(candidate))
    .sort((a, b) => b.length - a.length);

  let sanitized = value.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "");
  for (const home of homeCandidates) {
    sanitized = sanitized.replace(new RegExp(escapeRegExp(home), "gi"), "~");
  }

  return sanitized
    .replace(/sk-ant-[A-Za-z0-9_-]+/g, "[redacted-api-key]")
    .replace(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
      "[redacted-email]",
    )
    .replace(
      /\b(Organization|Org|Email|Account|User):\s*[^\r\n]+/gi,
      "$1: [redacted]",
    )
    .replace(/\boauth[^\s\\/"]*/gi, "[redacted-auth-file]")
    .replace(/~[\\/]\\.claude-profiles[\\/][^\\/\s\r\n"]+/gi, (match) =>
      match.includes("\\")
        ? "~\\.claude-profiles\\<hidden>"
        : "~/.claude-profiles/<hidden>",
    )
    .replace(
      /(^|[^\w.-])\.claude-profiles[\\/][^\\/\s\r\n"]+/gi,
      (match, prefix: string) =>
        `${prefix}.claude-profiles${match.includes("\\") ? "\\<hidden>" : "/<hidden>"}`,
    )
    .replace(/[A-Z]:\\Users\\[^\\\r\n"]+/gi, "~")
    .replace(/\/Users\/[^/\r\n"]+/gi, "~")
    .trim();
}

export function discoveredProfileDisplayPath(
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
): string {
  const home = getHomePath(env);
  return isWindowsLikePath(home) || process.platform === "win32"
    ? "~\\.claude-profiles\\<hidden>"
    : "~/.claude-profiles/<hidden>";
}

export function sanitizeManualProfileDisplayPath(
  value: string,
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
): string {
  const portable = toPortableHomePath(value, env);
  const separator = portable.includes("\\") ? "\\" : "/";
  return sanitizeClaudeDisplayText(portable, env)
    .split(/[\\/]/)
    .map((segment) =>
      /@|sk-ant-|org|corp|company|account|oauth/i.test(segment)
        ? "[redacted]"
        : segment,
    )
    .join(separator);
}

export function getNativeClaudeInstallPath(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): string {
  const home = getHomePath(env);
  return isWindowsLikePath(home) || process.platform === "win32"
    ? pathApiFor(home).join(home, ".local", "bin", "claude.exe")
    : path.posix.join(home, ".local", "bin", "claude");
}
