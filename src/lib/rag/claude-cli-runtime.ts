import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  buildClaudeExecutableCandidates,
  buildClaudeLoginCandidates,
  expandUserPath,
  sanitizeClaudeDisplayText,
  toPortableHomePath,
  type ClaudeCommandSource,
  type ClaudeInternalProfile,
} from "@/lib/claude/discovery";
import { commandExists } from "@/lib/rag/claude-cli-process";
import type { LlmProvider } from "@/lib/rag/llm-types";
import { getRuntimeProviderValue } from "@/lib/settings/runtime-config";

export interface ResolvedCliCommand {
  command: string;
  displayCommand: string;
  configuredCliPath: string;
  source: "env" | "native-install" | "path";
}

export interface ResolvedLoginCommand {
  command: string;
  displayCommand: string;
  configuredLoginCommand: string;
  source: ClaudeCommandSource;
  available: boolean;
}

export function profileConfigDir(
  profile: ClaudeInternalProfile,
): string | null {
  return profile.portableConfigDir || null;
}

export function profileFingerprint(
  provider: LlmProvider,
  profile: ClaudeInternalProfile,
): string {
  return createHash("sha256")
    .update(`${provider}:${profile.id}:${profile.portableConfigDir}`)
    .digest("hex")
    .slice(0, 16);
}

export function getLlmProvider(): LlmProvider {
  return getRuntimeProviderValue("LLM_PROVIDER") === "claude_code_cli"
    ? "claude_code_cli"
    : "anthropic_api";
}

export function isClaudeCliEnabled(): boolean {
  return getRuntimeProviderValue("ENABLE_LOCAL_CLAUDE_CLI") === "true";
}

export function getClaudeCliPath(): string {
  return getRuntimeProviderValue("CLAUDE_CLI_PATH")?.trim() || "auto";
}

export function getClaudeLoginCommand(): string {
  return getRuntimeProviderValue("CLAUDE_LOGIN_COMMAND")?.trim() || "auto";
}

export function getClaudeConfigDir(): string | null {
  const value = getRuntimeProviderValue("CLAUDE_CONFIG_DIR")?.trim();
  return value || null;
}

export function getClaudeCliTimeoutMs(): number {
  const parsed = Number(getRuntimeProviderValue("CLAUDE_CLI_TIMEOUT_MS"));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 120_000;
}

export function buildClaudeCliEnvForCommand(
  configDir = getClaudeConfigDir(),
): NodeJS.ProcessEnv {
  return getClaudeCliEnv(configDir);
}

export function getClaudeCliEnv(
  configDir = getClaudeConfigDir(),
): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY;

  const selectedConfigDir = configDir?.trim();
  if (selectedConfigDir) {
    env.CLAUDE_CONFIG_DIR = expandUserPath(selectedConfigDir);
  } else {
    delete env.CLAUDE_CONFIG_DIR;
  }

  return env;
}

function isWindowsLikePath(value: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(value) || value.includes("\\");
}

function executableNameForDirectory(directory: string): string {
  return isWindowsLikePath(directory) || process.platform === "win32"
    ? "claude.exe"
    : "claude";
}

async function resolveConfiguredCliCommand(
  command: string,
): Promise<string> {
  try {
    const stat = await fs.stat(command);
    if (!stat.isDirectory()) return command;
  } catch {
    return command;
  }

  const api = isWindowsLikePath(command) ? path.win32 : path.posix;
  return api.join(command, executableNameForDirectory(command));
}

function displayCliCommand(command: string): string {
  return sanitizeClaudeDisplayText(toPortableHomePath(command));
}

export async function resolveClaudeCliCommand(): Promise<ResolvedCliCommand> {
  const configuredCliPath = getClaudeCliPath();
  const candidates = buildClaudeExecutableCandidates(configuredCliPath);

  for (const candidate of candidates) {
    if (candidate.source === "env") {
      const command = await resolveConfiguredCliCommand(candidate.command);
      return {
        command,
        displayCommand: displayCliCommand(command),
        configuredCliPath,
        source: candidate.source,
      };
    }

    if (candidate.source === "native-install") {
      try {
        await fs.access(candidate.command);
        return {
          command: candidate.command,
          displayCommand: candidate.displayCommand,
          configuredCliPath,
          source: candidate.source,
        };
      } catch {
        continue;
      }
    }

    if (candidate.source === "path") {
      return {
        command: candidate.command,
        displayCommand: candidate.displayCommand,
        configuredCliPath,
        source: candidate.source,
      };
    }
  }

  const fallback = candidates.at(-1);
  return {
    command: fallback?.command ?? "claude",
    displayCommand: fallback?.displayCommand ?? "claude",
    configuredCliPath,
    source: "path",
  };
}

export async function resolveClaudeLoginCommand(
  claudeCommand: string,
): Promise<ResolvedLoginCommand> {
  const configuredLoginCommand = getClaudeLoginCommand();
  const candidates = buildClaudeLoginCandidates(
    configuredLoginCommand,
    claudeCommand,
  );

  for (const candidate of candidates) {
    if (await commandExists(candidate.command)) {
      return {
        command: candidate.command,
        displayCommand: candidate.displayCommand,
        configuredLoginCommand,
        source: candidate.source,
        available: true,
      };
    }
  }

  const builtinDisplayCommand = `${sanitizeClaudeDisplayText(
    toPortableHomePath(claudeCommand),
  )} auth login`;

  return {
    command: claudeCommand,
    displayCommand: builtinDisplayCommand,
    configuredLoginCommand,
    source: "missing",
    available: false,
  };
}
