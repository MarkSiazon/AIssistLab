import {
  expandUserPath,
  getNativeClaudeInstallPath,
  isWindowsLikePath,
  joinNearHome,
  pathApiFor,
  sanitizeClaudeDisplayText,
  toPortableHomePath,
} from "@/lib/claude/discovery-paths";
import type { ClaudeCommandCandidate } from "@/lib/claude/discovery-types";

function uniqueCandidates(
  candidates: ClaudeCommandCandidate[],
): ClaudeCommandCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = candidate.command.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isAutoValue(value: string | undefined | null, aliases: string[]): boolean {
  const normalized = value?.trim().toLowerCase();
  return !normalized || aliases.includes(normalized);
}

function isPathLikeCommand(value: string): boolean {
  return (
    value.includes("\\") ||
    value.includes("/") ||
    /^[A-Za-z]:[\\/]/.test(value)
  );
}

export function buildClaudeExecutableCandidates(
  configuredCliPath: string | undefined | null,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): ClaudeCommandCandidate[] {
  if (
    !isAutoValue(configuredCliPath, [
      "",
      "auto",
      "claude",
      "claude.exe",
    ])
  ) {
    const command = expandUserPath(configuredCliPath ?? "", env);
    return [
      {
        command,
        displayCommand: sanitizeClaudeDisplayText(
          toPortableHomePath(command, env),
          env,
        ),
        source: "env",
      },
    ];
  }

  const nativePath = getNativeClaudeInstallPath(env);
  return [
    {
      command: nativePath,
      displayCommand: sanitizeClaudeDisplayText(
        toPortableHomePath(nativePath, env),
        env,
      ),
      source: "native-install",
    },
    {
      command: process.platform === "win32" ? "claude.exe" : "claude",
      displayCommand: process.platform === "win32" ? "claude.exe" : "claude",
      source: "path",
    },
  ];
}

export function buildClaudeLoginCandidates(
  configuredLoginCommand: string | undefined | null,
  claudeCommand: string,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): ClaudeCommandCandidate[] {
  if (isAutoValue(configuredLoginCommand, ["", "auto"])) {
    return [];
  }

  const configured = configuredLoginCommand?.trim();
  if (configured && configured.toLowerCase() !== "claude-login") {
    const command = expandUserPath(configuredLoginCommand ?? "", env);
    return [
      {
        command,
        displayCommand: sanitizeClaudeDisplayText(
          toPortableHomePath(command, env),
          env,
        ),
        source: "env",
      },
    ];
  }

  const candidates: ClaudeCommandCandidate[] = [];
  const winLike = isWindowsLikePath(claudeCommand) || process.platform === "win32";
  const loginNames = winLike
    ? ["claude-login.cmd", "claude-login.bat", "claude-login.ps1", "claude-login"]
    : ["claude-login"];

  if (isPathLikeCommand(claudeCommand)) {
    const api = pathApiFor(claudeCommand);
    const siblingDir = api.dirname(claudeCommand);
    for (const name of loginNames) {
      const command = api.join(siblingDir, name);
      candidates.push({
        command,
        displayCommand: sanitizeClaudeDisplayText(
          toPortableHomePath(command, env),
          env,
        ),
        source: "sibling",
      });
    }
  }

  const userBinCommand = joinNearHome(
    env,
    ".local",
    "bin",
    winLike ? "claude-login.cmd" : "claude-login",
  );
  candidates.push({
    command: userBinCommand,
    displayCommand: sanitizeClaudeDisplayText(
      toPortableHomePath(userBinCommand, env),
      env,
    ),
    source: "user-bin",
  });

  candidates.push({
    command: "claude-login",
    displayCommand: "claude-login",
    source: "path",
  });

  return uniqueCandidates(candidates);
}
