import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { ENV_PATH, parseEnv } from "@/lib/settings/env";
import type {
  LlmProvider,
  RuntimeProviderSource,
} from "@/lib/rag/llm-types";

export const PROVIDER_RUNTIME_KEYS = [
  "LLM_PROVIDER",
  "ENABLE_LOCAL_CLAUDE_CLI",
  "CLAUDE_CLI_PATH",
  "CLAUDE_LOGIN_COMMAND",
  "CLAUDE_CONFIG_DIR",
  "CLAUDE_CLI_TIMEOUT_MS",
  "ANTHROPIC_API_KEY",
] as const;

export type ProviderRuntimeKey = (typeof PROVIDER_RUNTIME_KEYS)[number];

export interface ActiveRuntimeProviderStatus {
  provider: LlmProvider;
  claudeCliEnabled: boolean;
  configDirConfigured: boolean;
  source: RuntimeProviderSource;
}

type RuntimeProviderValues = Record<ProviderRuntimeKey, string>;
type RuntimeProviderFingerprints = Record<ProviderRuntimeKey, string>;

interface RuntimeProviderSettings {
  appliedAt: string;
  values: RuntimeProviderValues;
}

interface RuntimeProviderCache {
  version: 1;
  appliedAt: string;
  valueFingerprints: RuntimeProviderFingerprints;
}

const globalRuntimeConfig = globalThis as typeof globalThis & {
  __RUNTIME_PROVIDER_SETTINGS?: RuntimeProviderSettings | null;
};

const RUNTIME_PROVIDER_SETTINGS_PATH = path.join(
  process.cwd(),
  ".next",
  "cache",
  "runtime-provider-settings.json",
);

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function materializeProviderValues(
  vars: Record<string, string>,
): RuntimeProviderValues {
  const values = {} as RuntimeProviderValues;
  for (const key of PROVIDER_RUNTIME_KEYS) {
    values[key] = hasOwn(vars, key) ? String(vars[key] ?? "").trim() : "";
  }
  return values;
}

function fingerprintValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function fingerprintProviderValues(
  values: RuntimeProviderValues,
): RuntimeProviderFingerprints {
  const fingerprints = {} as RuntimeProviderFingerprints;
  for (const key of PROVIDER_RUNTIME_KEYS) {
    fingerprints[key] = fingerprintValue(values[key]);
  }
  return fingerprints;
}

function fingerprintsMatch(
  first: RuntimeProviderFingerprints,
  second: RuntimeProviderFingerprints,
): boolean {
  return PROVIDER_RUNTIME_KEYS.every((key) => first[key] === second[key]);
}

function readEnvProviderValues(): RuntimeProviderValues | null {
  try {
    return materializeProviderValues(
      parseEnv(fs.readFileSync(ENV_PATH, "utf-8")),
    );
  } catch {
    return null;
  }
}

function normalizeRuntimeCache(value: unknown): RuntimeProviderCache | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as {
    appliedAt?: unknown;
    valueFingerprints?: unknown;
  };
  if (
    !candidate.valueFingerprints ||
    typeof candidate.valueFingerprints !== "object"
  ) {
    return null;
  }

  const valueFingerprints = {} as RuntimeProviderFingerprints;
  for (const key of PROVIDER_RUNTIME_KEYS) {
    const raw = (candidate.valueFingerprints as Record<string, unknown>)[key];
    if (typeof raw !== "string" || raw.length === 0) {
      return null;
    }
    valueFingerprints[key] = raw;
  }

  return {
    version: 1,
    appliedAt:
      typeof candidate.appliedAt === "string"
        ? candidate.appliedAt
        : new Date().toISOString(),
    valueFingerprints,
  };
}

function readRuntimeProviderSettings(): RuntimeProviderSettings | null {
  if (hasOwn(globalRuntimeConfig, "__RUNTIME_PROVIDER_SETTINGS")) {
    return globalRuntimeConfig.__RUNTIME_PROVIDER_SETTINGS ?? null;
  }

  try {
    const cached = normalizeRuntimeCache(
      JSON.parse(fs.readFileSync(RUNTIME_PROVIDER_SETTINGS_PATH, "utf-8")),
    );
    if (!cached) return null;

    const envValues = readEnvProviderValues();
    if (!envValues) return null;

    if (
      !fingerprintsMatch(
        cached.valueFingerprints,
        fingerprintProviderValues(envValues),
      )
    ) {
      return null;
    }

    const settings = {
      appliedAt: cached.appliedAt,
      values: envValues,
    };
    globalRuntimeConfig.__RUNTIME_PROVIDER_SETTINGS = settings;
    return settings;
  } catch {
    return null;
  }
}

function writeRuntimeProviderSettings(settings: RuntimeProviderSettings): void {
  globalRuntimeConfig.__RUNTIME_PROVIDER_SETTINGS = settings;
  fs.mkdirSync(path.dirname(RUNTIME_PROVIDER_SETTINGS_PATH), {
    recursive: true,
  });
  const cache: RuntimeProviderCache = {
    version: 1,
    appliedAt: settings.appliedAt,
    valueFingerprints: fingerprintProviderValues(settings.values),
  };
  fs.writeFileSync(
    RUNTIME_PROVIDER_SETTINGS_PATH,
    `${JSON.stringify(cache)}\n`,
    "utf-8",
  );
}

export function clearRuntimeProviderSettings(): void {
  globalRuntimeConfig.__RUNTIME_PROVIDER_SETTINGS = null;
  try {
    fs.rmSync(RUNTIME_PROVIDER_SETTINGS_PATH, { force: true });
  } catch {
    /* Clearing runtime state is best-effort for tests and local resets. */
  }
}

export function getRuntimeProviderValue(
  key: ProviderRuntimeKey,
): string | undefined {
  const runtime = readRuntimeProviderSettings();
  if (runtime && hasOwn(runtime.values, key)) {
    return runtime.values[key];
  }
  return process.env[key];
}

export function getActiveProviderRuntimeEnv(): Partial<
  Record<ProviderRuntimeKey, string>
> {
  const values: Partial<Record<ProviderRuntimeKey, string>> = {};
  for (const key of PROVIDER_RUNTIME_KEYS) {
    const value = getRuntimeProviderValue(key);
    if (value !== undefined) {
      values[key] = value;
    }
  }
  return values;
}

export function getActiveRuntimeProviderStatus(): ActiveRuntimeProviderStatus {
  const runtime = readRuntimeProviderSettings();
  const provider =
    getRuntimeProviderValue("LLM_PROVIDER") === "claude_code_cli"
      ? "claude_code_cli"
      : "anthropic_api";
  const claudeCliEnabled =
    getRuntimeProviderValue("ENABLE_LOCAL_CLAUDE_CLI") === "true";
  const configDirConfigured =
    (getRuntimeProviderValue("CLAUDE_CONFIG_DIR") ?? "").trim().length > 0;

  return {
    provider,
    claudeCliEnabled,
    configDirConfigured,
    source: runtime ? "runtime" : "process",
  };
}

export function applyRuntimeProviderSettings(
  vars: Record<string, string>,
): ActiveRuntimeProviderStatus {
  writeRuntimeProviderSettings({
    appliedAt: new Date().toISOString(),
    values: materializeProviderValues(vars),
  });

  return getActiveRuntimeProviderStatus();
}
