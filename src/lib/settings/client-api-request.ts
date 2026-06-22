import {
  apiErrorMessage,
  postJson,
  requestJsonWithFetcher,
} from "@/lib/api/client";
import type { SettingsFetcher } from "@/lib/settings/client-api-types";

export { apiErrorMessage, postJson };

export function globalFetcher(): SettingsFetcher {
  return fetch;
}

export async function requestJson<T>(
  fetcher: SettingsFetcher,
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  fallbackError: string,
): Promise<T> {
  return requestJsonWithFetcher<T>(fetcher, input, init, fallbackError);
}
