import { spawnSync } from "node:child_process";

export function buildCommandInvocation(
  command,
  args = [],
  platform = process.platform,
) {
  const commandLine = [command, ...args].join(" ");
  if (platform === "win32" && command === "npm") {
    return {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", commandLine],
    };
  }

  return { command, args };
}

export function runCommand(label, command, args = [], options = {}) {
  console.log(`\n==> ${label}`);
  const invocation = buildCommandInvocation(command, args);
  const result = spawnSync(invocation.command, invocation.args, {
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
