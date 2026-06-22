import fs from "node:fs/promises";
import path from "node:path";

export const ENV_PATH = path.join(process.cwd(), ".env.local");

export function parseEnv(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

export function serializeEnv(vars: Record<string, string>): string {
  return (
    Object.entries(vars)
      .map(([key, value]) => {
        const needsQuotes = /\s/.test(value);
        return `${key}=${needsQuotes ? `"${value}"` : value}`;
      })
      .join("\n") + "\n"
  );
}

export async function readEnvFile(): Promise<{
  raw: string;
  parsed: Record<string, string>;
  path: string;
}> {
  let raw = "";
  try {
    raw = await fs.readFile(ENV_PATH, "utf-8");
  } catch {
    /* missing .env.local is valid before first save */
  }

  return {
    raw,
    parsed: parseEnv(raw),
    path: ENV_PATH,
  };
}

export async function writeEnvFile(content: string): Promise<void> {
  await fs.writeFile(ENV_PATH, content, "utf-8");
}
