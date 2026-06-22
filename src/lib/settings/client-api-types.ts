import type { FirstRunChatStatus } from "@/lib/settings/first-run-checklist";
import type { PublicIndexState } from "@/lib/rag/index-state";
import type { SetupDoctorReport } from "@/lib/settings/doctor";
import type { SkillQualityReport } from "@/lib/skills/quality";

export type SettingsFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export interface SettingsEnvData {
  raw: string;
  parsed: Record<string, string>;
  path: string;
}

export interface ClaudeProfileSelectionPayload {
  profileId?: string;
  manualConfigDir?: string;
}

export interface ActiveRuntimeProviderStatus {
  provider: "anthropic_api" | "claude_code_cli";
  claudeCliEnabled: boolean;
  configDirConfigured: boolean;
  source: "runtime" | "process";
}

export interface ClaudeCliTestResult {
  checked: boolean;
  ok: boolean | null;
  output: string | null;
  error: string | null;
  provider?: "anthropic_api" | "claude_code_cli";
  profileId?: string;
  configFingerprint?: string;
}

export interface ClaudeProfileSummary {
  id: string;
  label: string;
  source: "default" | "discovered" | "manual";
  displayPath: string;
  selected: boolean;
  exists: boolean;
  auth: {
    checked: boolean;
    loggedIn: boolean | null;
    method: string | null;
    error: string | null;
  };
}

export interface ClaudeCliStatus {
  provider: "anthropic_api" | "claude_code_cli";
  enabled: boolean;
  cliPath: string;
  configuredCliPath: string;
  cliPathSource: "env" | "native-install" | "path";
  loginCommand: string;
  loginCommandSource: "env" | "sibling" | "user-bin" | "path" | "missing";
  loginHelperAvailable: boolean;
  canOpenLogin: boolean;
  configDirConfigured: boolean;
  installed: boolean;
  version: string | null;
  profiles: ClaudeProfileSummary[];
  selectedProfile: ClaudeProfileSummary;
  selectedProfileFingerprint: string;
  lastCliSmokeTest: ClaudeCliTestResult | null;
  auth: {
    checked: boolean;
    loggedIn: boolean | null;
    method: string | null;
    error: string | null;
  };
}

export type ReleaseReadinessStatus = "ready" | "needs_action" | "blocked";

export interface ReleaseReadinessReport {
  schemaVersion: 1;
  generatedAt: string;
  summary: {
    status: ReleaseReadinessStatus;
    score: number;
    topAction: string | null;
    canChat: boolean;
    canExportDiagnostics: boolean;
  };
  sections: Array<{
    id:
      | "workspace"
      | "provider"
      | "index"
      | "skills"
      | "claude_project"
      | "chat"
      | "diagnostics";
    label: string;
    status: ReleaseReadinessStatus;
    message: string;
    actionLabel?: string;
    actionHref?: string;
  }>;
}

export interface SaveSettingsFieldsInput {
  vars: Record<string, string>;
  claudeProfileSelection: ClaudeProfileSelectionPayload;
}

export interface SaveSettingsResponse {
  raw?: string;
  parsed?: Record<string, string>;
  activeRuntime?: ActiveRuntimeProviderStatus;
}

export interface ClaudeProfileActionInput {
  profileSelection: ClaudeProfileSelectionPayload;
}

export interface OpenClaudeLoginResponse {
  loginCommand: string;
}

export interface ApiErrorPayload {
  error?: unknown;
}

export type {
  FirstRunChatStatus,
  PublicIndexState,
  SetupDoctorReport,
  SkillQualityReport,
};
