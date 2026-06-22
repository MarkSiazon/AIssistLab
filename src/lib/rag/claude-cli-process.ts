import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { sanitizeClaudeDisplayText } from "@/lib/claude/discovery";

export interface ProcessResult {
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  error?: string;
}

export function sanitizeCliOutput(value: string): string {
  return sanitizeClaudeDisplayText(value);
}

export function runProcess(
  command: string,
  args: string[],
  options: {
    env?: NodeJS.ProcessEnv;
    cwd?: string;
    timeoutMs?: number;
    windowsHide?: boolean;
  } = {},
): Promise<ProcessResult> {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;

    const child = spawn(command, args, {
      cwd: options.cwd ?? process.cwd(),
      env: options.env ?? process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: options.windowsHide ?? true,
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, options.timeoutMs ?? 15_000);

    const settle = (result: ProcessResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(result);
    };

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      settle({
        code: null,
        stdout,
        stderr,
        timedOut,
        error: sanitizeCliOutput(error.message),
      });
    });

    child.on("close", (code) => {
      settle({ code, stdout, stderr, timedOut });
    });
  });
}

function isPathLikeCommand(command: string): boolean {
  return (
    command.includes("\\") ||
    command.includes("/") ||
    /^[A-Za-z]:[\\/]/.test(command)
  );
}

export async function commandExists(command: string): Promise<boolean> {
  if (isPathLikeCommand(command)) {
    try {
      await fs.access(command);
      return true;
    } catch {
      return false;
    }
  }

  const result =
    process.platform === "win32"
      ? await runProcess("where.exe", [command], { timeoutMs: 5_000 })
      : await runProcess("which", [command], { timeoutMs: 5_000 });

  return result.code === 0;
}

export function buildClaudePromptArgs(
  query: string,
  systemPrompt?: string,
): string[] {
  const args = [
    "-p",
    query,
    "--safe-mode",
    "--tools",
    "",
    "--no-session-persistence",
    "--max-turns",
    "1",
    "--output-format",
    "text",
  ];

  if (systemPrompt) {
    args.push("--system-prompt", systemPrompt);
  }

  return args;
}

export function cleanCliFailure(result: ProcessResult): string {
  return sanitizeCliOutput(
    result.error ||
      [result.stderr, result.stdout].filter(Boolean).join("\n") ||
      `Claude CLI exited with code ${result.code}.`,
  );
}

function quoteForCmd(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function validateLaunchPart(value: string, label: string): void {
  if (/[&|<>\r\n]/.test(value)) {
    throw new Error(
      `Configured Claude login ${label} contains unsupported shell characters.`,
    );
  }
}

export function buildVisibleLaunchCommand(
  command: string,
  args: string[],
  platform: NodeJS.Platform = process.platform,
): { command: string; args: string[] } {
  validateLaunchPart(command, "command");
  for (const arg of args) validateLaunchPart(arg, "argument");

  if (platform === "win32") {
    const invocation = [quoteForCmd(command), ...args.map(quoteForCmd)].join(" ");
    return {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", `start "Claude Login" ${invocation}`],
    };
  }

  return { command, args };
}

export function launchVisibleCommand(
  command: string,
  args: string[],
  env?: NodeJS.ProcessEnv,
): void {
  const launch = buildVisibleLaunchCommand(command, args);

  if (process.platform === "win32") {
    const child = spawn(
      launch.command,
      launch.args,
      {
        detached: true,
        env: env ?? process.env,
        stdio: "ignore",
        windowsHide: false,
      },
    );
    child.unref();
    return;
  }

  const child = spawn(launch.command, launch.args, {
    detached: true,
    env: env ?? process.env,
    stdio: "ignore",
    windowsHide: false,
  });
  child.unref();
}
