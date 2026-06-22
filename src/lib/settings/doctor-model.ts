import type { ClaudeProjectInventory } from "@/lib/claude/project-inventory";
import type { RagIndexStateStatus } from "@/lib/rag/index-state";
import {
  sanitizeCliOutput,
  type ClaudeCliStatus,
  type ClaudeCliTestResult,
} from "@/lib/rag/llm-config";
import {
  PROVIDER_RUNTIME_KEYS,
  type ProviderRuntimeKey,
} from "@/lib/settings/runtime-config";

export type DoctorCheckStatus = "ok" | "warn" | "error";
export type ReadinessSeverity = "blocking" | "warning" | "optional";

export type DoctorCheckGroup =
  | "workspace"
  | "rag"
  | "provider"
  | "cli"
  | "login"
  | "claude-project";

export interface DoctorPathState {
  exists: boolean;
  isDirectory: boolean;
}

export interface SetupDoctorInput {
  env: Record<string, string>;
  runtimeEnv?: Record<string, string | undefined>;
  paths: {
    workspaceRoot: DoctorPathState;
    skillsDir: DoctorPathState;
  };
  index: {
    status: RagIndexStateStatus;
    builtAt: string | null;
    skillCount: number;
    chunkCount: number;
    staleReason: string | null;
    error: string | null;
  };
  claude: ClaudeCliStatus;
  claudeProject?: ClaudeProjectInventory;
  cliTest?: ClaudeCliTestResult;
  activeProviderEnv?: Partial<Record<ProviderRuntimeKey, string>>;
}

export interface SetupDoctorCheck {
  id: string;
  group: DoctorCheckGroup;
  title: string;
  status: DoctorCheckStatus;
  severity: ReadinessSeverity;
  message: string;
  suggestedFix?: string;
  relatedEnvKeys: string[];
}

export interface SetupDoctorReport {
  summary: {
    status: DoctorCheckStatus;
    readinessScore: number;
    errorCount: number;
    warningCount: number;
    okCount: number;
    topRecommendation: string | null;
  };
  checks: SetupDoctorCheck[];
  claudeProject: ClaudeProjectInventory | null;
}

export const KNOWN_RUNTIME_KEYS = [
  "ANTHROPIC_API_KEY",
  "WORKSPACE_ROOT",
  "SKILLS_DIR",
  "LLM_PROVIDER",
  "ENABLE_LOCAL_CLAUDE_CLI",
  "CLAUDE_CLI_PATH",
  "CLAUDE_LOGIN_COMMAND",
  "CLAUDE_CONFIG_DIR",
  "CLAUDE_CLI_TIMEOUT_MS",
];

export function isPlaceholderApiKey(value: string | undefined): boolean {
  const trimmed = value?.trim();
  return !trimmed || trimmed === "your-api-key-here";
}

export function providerFromEnv(
  env: Record<string, string>,
): "anthropic_api" | "claude_code_cli" {
  return env.LLM_PROVIDER === "claude_code_cli"
    ? "claude_code_cli"
    : "anthropic_api";
}

export function sanitizeDoctorText(value: string): string {
  return sanitizeCliOutput(value)
    .replace(/[A-Z]:\\Users\\[^\\\s"]+/gi, "~")
    .replace(/SecretOrg/gi, "[redacted]")
    .replace(/\bOrganization:\s*[^\n\r]+/gi, "Organization: [redacted]");
}

export function severityForStatus(
  status: DoctorCheckStatus,
): ReadinessSeverity {
  if (status === "error") return "blocking";
  if (status === "warn") return "warning";
  return "optional";
}

export function createDoctorCheck(
  id: string,
  group: DoctorCheckGroup,
  title: string,
  status: DoctorCheckStatus,
  message: string,
  relatedEnvKeys: string[],
  suggestedFix?: string,
): SetupDoctorCheck {
  return {
    id,
    group,
    title,
    status,
    severity: severityForStatus(status),
    message: sanitizeDoctorText(message),
    suggestedFix: suggestedFix ? sanitizeDoctorText(suggestedFix) : undefined,
    relatedEnvKeys,
  };
}

export function sanitizeClaudeProjectInventory(
  inventory: ClaudeProjectInventory | undefined,
): ClaudeProjectInventory | null {
  if (!inventory) return null;

  return {
    workspaceDisplay: sanitizeDoctorText(inventory.workspaceDisplay),
    counts: inventory.counts,
    checks: inventory.checks.map((item) => ({
      id: item.id,
      status: item.status,
      title: sanitizeDoctorText(item.title),
      message: sanitizeDoctorText(item.message),
      suggestedFix: item.suggestedFix
        ? sanitizeDoctorText(item.suggestedFix)
        : undefined,
    })),
    reloadHints: inventory.reloadHints.map((hint) => sanitizeDoctorText(hint)),
  };
}

export function findRuntimeDrift(
  env: Record<string, string>,
  runtimeEnv: Record<string, string | undefined> | undefined,
  activeProviderEnv: Partial<Record<ProviderRuntimeKey, string>> | undefined,
): string[] {
  if (!runtimeEnv) return [];

  return KNOWN_RUNTIME_KEYS.filter((key) => {
    const fileValue = env[key] ?? "";
    const runtimeValue = PROVIDER_RUNTIME_KEYS.includes(
      key as ProviderRuntimeKey,
    )
      ? activeProviderEnv?.[key as ProviderRuntimeKey] ?? runtimeEnv[key] ?? ""
      : runtimeEnv[key] ?? "";
    return fileValue !== runtimeValue;
  });
}

export function summarizeDoctorChecks(
  checks: SetupDoctorCheck[],
): SetupDoctorReport["summary"] {
  const errorCount = checks.filter((item) => item.status === "error").length;
  const warningCount = checks.filter((item) => item.status === "warn").length;
  const okCount = checks.filter((item) => item.status === "ok").length;
  const readinessScore = Math.max(0, 100 - errorCount * 30 - warningCount * 10);
  const firstAction = checks.find((item) => item.status !== "ok");

  return {
    status: errorCount > 0 ? "error" : warningCount > 0 ? "warn" : "ok",
    readinessScore,
    errorCount,
    warningCount,
    okCount,
    topRecommendation:
      firstAction?.suggestedFix ?? firstAction?.message ?? "Setup is ready.",
  };
}
