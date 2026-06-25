import { getUnavailableClaudeCliStatus } from "@/lib/settings/client-api-fallbacks";
import {
  apiErrorMessage,
  postJson,
  requestJsonWithFetcher,
} from "@/lib/api/client";
import { API_ROUTES, apiSettingsPathExistsRoute } from "@/lib/routes/api-routes";
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
  fetcher: SettingsFetcher = fetch,
): Promise<SettingsEnvData> {
  const payload = await requestJsonWithFetcher<
    Partial<SettingsEnvData> & ApiErrorPayload
  >(
    fetcher,
    API_ROUTES.settings,
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
  fetcher: SettingsFetcher = fetch,
): Promise<ActiveRuntimeProviderStatus> {
  return requestJsonWithFetcher<ActiveRuntimeProviderStatus>(
    fetcher,
    API_ROUTES.settingsRuntime,
    undefined,
    "Unable to load runtime status",
  );
}

export async function fetchChatReadiness(
  fetcher: SettingsFetcher = fetch,
): Promise<FirstRunChatStatus> {
  const payload = await requestJsonWithFetcher<{
    canSend?: boolean;
    blockingReason?: unknown;
    suggestedAction?: unknown;
  }>(
    fetcher,
    API_ROUTES.chatStatus,
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
  fetcher: SettingsFetcher = fetch,
): Promise<PublicIndexState> {
  return requestJsonWithFetcher<PublicIndexState>(
    fetcher,
    API_ROUTES.index,
    undefined,
    "Unable to load index status",
  );
}

export async function fetchSkillQualityReport(
  fetcher: SettingsFetcher = fetch,
): Promise<SkillQualityReport> {
  return requestJsonWithFetcher<SkillQualityReport>(
    fetcher,
    API_ROUTES.skillsValidation,
    undefined,
    "Unable to load skill quality report",
  );
}

export async function fetchReleaseReadiness(
  fetcher: SettingsFetcher = fetch,
): Promise<ReleaseReadinessReport> {
  return requestJsonWithFetcher<ReleaseReadinessReport>(
    fetcher,
    API_ROUTES.releaseReadiness,
    undefined,
    "Unable to load release readiness",
  );
}

export async function fetchDoctorReport(
  fetcher: SettingsFetcher = fetch,
): Promise<SetupDoctorReport> {
  return requestJsonWithFetcher<SetupDoctorReport>(
    fetcher,
    API_ROUTES.settingsDoctor,
    undefined,
    "Unable to load Setup Doctor",
  );
}

export async function fetchClaudeCliStatus(
  fetcher: SettingsFetcher = fetch,
): Promise<ClaudeCliStatus> {
  return requestJsonWithFetcher<ClaudeCliStatus>(
    fetcher,
    API_ROUTES.settingsClaudeCli,
    undefined,
    "Unable to load Claude CLI status",
  );
}

export async function openClaudeLogin(
  input: ClaudeProfileActionInput,
  fetcher: SettingsFetcher = fetch,
): Promise<OpenClaudeLoginResponse> {
  return requestJsonWithFetcher<OpenClaudeLoginResponse>(
    fetcher,
    API_ROUTES.settingsClaudeCli,
    postJson(input),
    "Unable to open Claude login",
  );
}

export async function testClaudeCli(
  input: ClaudeProfileActionInput,
  fetcher: SettingsFetcher = fetch,
): Promise<ClaudeCliTestResult> {
  return requestJsonWithFetcher<ClaudeCliTestResult>(
    fetcher,
    API_ROUTES.settingsClaudeCliTest,
    postJson(input),
    "Claude CLI test failed",
  );
}

export async function saveSettingsFields(
  input: SaveSettingsFieldsInput,
  fetcher: SettingsFetcher = fetch,
): Promise<SaveSettingsResponse> {
  return requestJsonWithFetcher<SaveSettingsResponse>(
    fetcher,
    API_ROUTES.settings,
    postJson(input),
    "Save failed",
  );
}

export async function saveSettingsRaw(
  raw: string,
  fetcher: SettingsFetcher = fetch,
): Promise<SaveSettingsResponse> {
  return requestJsonWithFetcher<SaveSettingsResponse>(
    fetcher,
    API_ROUTES.settings,
    postJson({ raw }),
    "Save failed",
  );
}

export async function rebuildRagIndex(
  fetcher: SettingsFetcher = fetch,
): Promise<PublicIndexState> {
  return requestJsonWithFetcher<PublicIndexState>(
    fetcher,
    API_ROUTES.index,
    { method: "POST" },
    "Unable to rebuild index",
  );
}

export async function checkSettingsPath(
  fetcher: SettingsFetcher,
  path: string,
): Promise<{ exists: boolean; isDirectory: boolean }> {
  return requestJsonWithFetcher<{ exists: boolean; isDirectory: boolean }>(
    fetcher,
    apiSettingsPathExistsRoute(path),
    undefined,
    "Unable to validate path",
  );
}
