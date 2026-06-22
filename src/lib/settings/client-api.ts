import { getUnavailableClaudeCliStatus } from "@/lib/settings/client-api-fallbacks";
import {
  apiErrorMessage,
  globalFetcher,
  postJson,
  requestJson,
} from "@/lib/settings/client-api-request";
import type {
  ActiveRuntimeProviderStatus,
  ApiErrorPayload,
  ClaudeCliStatus,
  ClaudeCliTestResult,
  ClaudeProfileActionInput,
  FirstRunChatStatus,
  OpenClaudeLoginResponse,
  PublicIndexState,
  ReleaseReadinessReport,
  SaveSettingsFieldsInput,
  SaveSettingsResponse,
  SettingsEnvData,
  SettingsFetcher,
  SetupDoctorReport,
  SkillQualityReport,
} from "@/lib/settings/client-api-types";

export type * from "@/lib/settings/client-api-types";
export { getUnavailableClaudeCliStatus };

export async function fetchSettingsEnv(
  fetcher = globalFetcher(),
): Promise<SettingsEnvData> {
  const payload = await requestJson<Partial<SettingsEnvData> & ApiErrorPayload>(
    fetcher,
    "/api/settings",
    undefined,
    "Settings API is unavailable in this server context.",
  );

  if (!payload.parsed) {
    throw new Error(
      apiErrorMessage(
        payload,
        "Settings API is unavailable in this server context.",
      ),
    );
  }

  return {
    raw: payload.raw ?? "",
    parsed: payload.parsed,
    path: payload.path ?? "",
  };
}

export async function fetchRuntimeStatus(
  fetcher = globalFetcher(),
): Promise<ActiveRuntimeProviderStatus> {
  return requestJson<ActiveRuntimeProviderStatus>(
    fetcher,
    "/api/settings/runtime",
    undefined,
    "Unable to load runtime status",
  );
}

export async function fetchChatReadiness(
  fetcher = globalFetcher(),
): Promise<FirstRunChatStatus> {
  const payload = await requestJson<{
    canSend?: boolean;
    blockingReason?: unknown;
    suggestedAction?: unknown;
  }>(
    fetcher,
    "/api/chat/status",
    undefined,
    "Unable to load chat readiness",
  );

  return {
    canSend: payload.canSend === true,
    blockingReason:
      typeof payload.blockingReason === "string"
        ? payload.blockingReason
        : null,
    suggestedAction:
      typeof payload.suggestedAction === "string"
        ? payload.suggestedAction
        : null,
  };
}

export async function fetchIndexStatus(
  fetcher = globalFetcher(),
): Promise<PublicIndexState> {
  return requestJson<PublicIndexState>(
    fetcher,
    "/api/index",
    undefined,
    "Unable to load index status",
  );
}

export async function fetchSkillQualityReport(
  fetcher = globalFetcher(),
): Promise<SkillQualityReport> {
  return requestJson<SkillQualityReport>(
    fetcher,
    "/api/skills/validation",
    undefined,
    "Unable to load skill quality report",
  );
}

export async function fetchReleaseReadiness(
  fetcher = globalFetcher(),
): Promise<ReleaseReadinessReport> {
  return requestJson<ReleaseReadinessReport>(
    fetcher,
    "/api/release/readiness",
    undefined,
    "Unable to load release readiness",
  );
}

export async function fetchDoctorReport(
  fetcher = globalFetcher(),
): Promise<SetupDoctorReport> {
  return requestJson<SetupDoctorReport>(
    fetcher,
    "/api/settings/doctor",
    undefined,
    "Unable to load Setup Doctor",
  );
}

export async function fetchClaudeCliStatus(
  fetcher = globalFetcher(),
): Promise<ClaudeCliStatus> {
  return requestJson<ClaudeCliStatus>(
    fetcher,
    "/api/settings/claude-cli",
    undefined,
    "Unable to load Claude CLI status",
  );
}

export async function openClaudeLogin(
  input: ClaudeProfileActionInput,
  fetcher = globalFetcher(),
): Promise<OpenClaudeLoginResponse> {
  return requestJson<OpenClaudeLoginResponse>(
    fetcher,
    "/api/settings/claude-cli",
    postJson(input),
    "Unable to open Claude login",
  );
}

export async function testClaudeCli(
  input: ClaudeProfileActionInput,
  fetcher = globalFetcher(),
): Promise<ClaudeCliTestResult> {
  return requestJson<ClaudeCliTestResult>(
    fetcher,
    "/api/settings/claude-cli/test",
    postJson(input),
    "Claude CLI test failed",
  );
}

export async function saveSettingsFields(
  input: SaveSettingsFieldsInput,
  fetcher = globalFetcher(),
): Promise<SaveSettingsResponse> {
  return requestJson<SaveSettingsResponse>(
    fetcher,
    "/api/settings",
    postJson(input),
    "Save failed",
  );
}

export async function saveSettingsRaw(
  raw: string,
  fetcher = globalFetcher(),
): Promise<SaveSettingsResponse> {
  return requestJson<SaveSettingsResponse>(
    fetcher,
    "/api/settings",
    postJson({ raw }),
    "Save failed",
  );
}

export async function rebuildRagIndex(
  fetcher = globalFetcher(),
): Promise<PublicIndexState> {
  return requestJson<PublicIndexState>(
    fetcher,
    "/api/index",
    { method: "POST" },
    "Unable to rebuild index",
  );
}

export async function checkSettingsPath(
  fetcher: SettingsFetcher,
  path: string,
): Promise<{ exists: boolean; isDirectory: boolean }> {
  return requestJson<{ exists: boolean; isDirectory: boolean }>(
    fetcher,
    `/api/settings/path-exists?path=${encodeURIComponent(path)}`,
    undefined,
    "Unable to validate path",
  );
}
