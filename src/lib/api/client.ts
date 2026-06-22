export interface ApiErrorPayload {
  error?: unknown;
}

export type ApiFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export function apiErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    typeof (payload as ApiErrorPayload).error === "string"
  ) {
    return (payload as ApiErrorPayload).error as string;
  }
  return fallback;
}

export async function readResponseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function requestJsonWithFetcher<T>(
  fetcher: ApiFetcher,
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  fallbackError: string,
): Promise<T> {
  const response = await fetcher(input, init);
  const payload = await readResponseJson(response);

  if (!response.ok) {
    throw new Error(apiErrorMessage(payload, fallbackError));
  }

  return payload as T;
}

export function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackError = "Request failed.",
): Promise<T> {
  return requestJsonWithFetcher<T>(fetch, input, init, fallbackError);
}

export async function optionalJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T | null> {
  const response = await fetch(input, init);
  if (!response.ok) return null;
  return (await readResponseJson(response)) as T;
}

export function jsonRequestInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function postJson(body: unknown): RequestInit {
  return jsonRequestInit("POST", body);
}
