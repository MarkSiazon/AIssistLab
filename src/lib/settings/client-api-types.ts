import type { ApiFetcher } from "@/lib/api/client";
import type { ClaudeProfileSummary as CanonicalClaudeProfileSummary } from "@/lib/claude/discovery";
import type { ClaudeCliStatus as CanonicalClaudeCliStatus } from "@/lib/rag/claude-cli-status";
import type { ClaudeCliTestResult as CanonicalClaudeCliTestResult } from "@/lib/rag/claude-cli-test-state";
import type { FirstRunChatStatus } from "@/lib/settings/first-run-checklist";
import type { PublicIndexState } from "@/lib/rag/index-state";
import type { ReleaseReadinessResponse } from "@/lib/release/readiness-types";
import type { ActiveRuntimeProviderStatus as CanonicalActiveRuntimeProviderStatus } from "@/lib/settings/runtime-config";
import type { SetupDoctorReport } from "@/lib/settings/doctor";
import type { SkillQualityReport } from "@/lib/skills/quality";

export type SettingsFetcher = ApiFetcher;

export interface SettingsEnvData {
  raw: string;
  parsed: Record<string, string>;
  path: string;
}

export interface ClaudeProfileSelectionPayload {
  profileId?: string;
  manualConfigDir?: string;
}

export type ActiveRuntimeProviderStatus = CanonicalActiveRuntimeProviderStatus;
export type ClaudeCliTestResult = CanonicalClaudeCliTestResult;
export type ClaudeProfileSummary = CanonicalClaudeProfileSummary;
export type ClaudeCliStatus = CanonicalClaudeCliStatus;

export type ReleaseReadinessReport = ReleaseReadinessResponse;

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
