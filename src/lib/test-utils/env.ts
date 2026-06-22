import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export type TestEnvValue = string | undefined;

function restoreEnv(key: string, previous: TestEnvValue): void {
  if (previous === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = previous;
  }
}

export async function withEnv(
  env: Record<string, TestEnvValue>,
  fn: () => Promise<void>,
): Promise<void> {
  const previousEnv = new Map(
    Object.keys(env).map((key) => [key, process.env[key]]),
  );

  try {
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }

    await fn();
  } finally {
    for (const [key, previous] of Array.from(previousEnv.entries())) {
      restoreEnv(key, previous);
    }
  }
}

export async function withTempCwd(
  prefix: string,
  fn: (root: string) => Promise<void>,
): Promise<void> {
  const originalCwd = process.cwd();
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));

  try {
    process.chdir(root);
    await fn(root);
  } finally {
    process.chdir(originalCwd);
    await fs.rm(root, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
  }
}
