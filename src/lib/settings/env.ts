import fs from "node:fs/promises";
import path from "node:path";
import { sanitizeClaudeDisplayText } from "@/lib/claude/discovery";

export const ENV_PATH = path.join(process.cwd(), ".env.local");
const PUBLIC_ENV_PATH = ".env.local";
export const REDACTED_ENV_VALUE = "<redacted>";

export interface SettingsEnvFile {
  raw: string;
  parsed: Record<string, string>;
  path: string;
}

function quoteEnvValue(value: string): string {
  const needsQuotes = /\s/.test(value);
  return needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value;
}

function isSensitiveEnvKey(key: string): boolean {
  return /(?:API_)?KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH/i.test(key);
}

function isRedactedEnvValue(value: string): boolean {
  return value.trim().replace(/^["']|["']$/g, "") === REDACTED_ENV_VALUE;
}

function shouldRedactEnvValue(key: string, value: string): boolean {
  if (!value) return false;
  if (isSensitiveEnvKey(key)) return true;
  if (/\bsk-[A-Za-z0-9._-]{6,}\b/i.test(value)) return true;
  if (/\bBearer\s+[A-Za-z0-9._-]{6,}\b/i.test(value)) return true;
  if (/\bAuthorization:\s*[^\r\n]+/i.test(value)) return true;

  return sanitizeClaudeDisplayText(value) !== value;
}

function publicEnvValue(key: string, value: string): string {
  return shouldRedactEnvValue(key, value) ? REDACTED_ENV_VALUE : value;
}

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
        return `${key}=${quoteEnvValue(value)}`;
      })
      .join("\n") + "\n"
  );
}

export function publicEnvFileFromRaw(raw: string): SettingsEnvFile {
  const parsed = parseEnv(raw);

  return {
    raw: redactRawEnv(raw),
    parsed: Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [
        key,
        publicEnvValue(key, value),
      ]),
    ),
    path: PUBLIC_ENV_PATH,
  };
}

function redactRawEnv(raw: string): string {
  return raw
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return line;

      const eq = line.indexOf("=");
      if (eq === -1) return line;

      const key = line.slice(0, eq).trim();
      const value = parseEnv(line)[key] ?? "";
      if (!shouldRedactEnvValue(key, value)) return line;

      return `${line.slice(0, eq + 1)}${REDACTED_ENV_VALUE}`;
    })
    .join("\n");
}

export function mergeRedactedEnvVars(
  vars: Record<string, string>,
  existing: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(vars).map(([key, value]) => [
      key,
      isRedactedEnvValue(value) ? (existing[key] ?? "") : value,
    ]),
  );
}

export function mergeRedactedRawEnv(
  raw: string,
  existing: Record<string, string>,
): string {
  return raw
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return line;

      const eq = line.indexOf("=");
      if (eq === -1) return line;

      const key = line.slice(0, eq).trim();
      const value = parseEnv(line)[key] ?? "";
      if (!isRedactedEnvValue(value)) return line;

      return `${line.slice(0, eq + 1)}${quoteEnvValue(existing[key] ?? "")}`;
    })
    .join("\n");
}

export async function readEnvFile(): Promise<SettingsEnvFile> {
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

export async function readPublicEnvFile(): Promise<SettingsEnvFile> {
  const envFile = await readEnvFile();
  return publicEnvFileFromRaw(envFile.raw);
}

export async function writeEnvFile(content: string): Promise<void> {
  await fs.writeFile(ENV_PATH, content, "utf-8");
}
