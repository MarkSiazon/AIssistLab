import { spawnSync } from "node:child_process";
import path from "node:path";

export function buildCommandInvocation(
  command,
  args = [],
  platform = process.platform,
  nodeExecutable = process.execPath,
) {
  if (platform === "win32" && command === "npm") {
    return {
      command: nodeExecutable,
      args: [
        path.join(
          path.dirname(nodeExecutable),
          "node_modules",
          "npm",
          "bin",
          "npm-cli.js",
        ),
        ...args,
      ],
    };
  }

  if (command === "npm" || command === "git" || command === nodeExecutable) {
    return { command, args };
  }

  throw new Error(`Unsupported release command: ${command}`);
}

export function runCommand(label, command, args = [], options = {}) {
  console.log(`\n==> ${label}`);
  let invocation;
  try {
    invocation = buildCommandInvocation(command, args);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
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
