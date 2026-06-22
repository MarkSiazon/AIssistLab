export const TEST_LOCAL_ORIGIN = "http://127.0.0.1:3000";
export const TEST_LOCAL_HOST = "127.0.0.1:3000";
export const TEST_NON_LOCAL_HOST = "example.com";

export interface TestRequestInit extends RequestInit {
  host?: string;
}

function resolveTestUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const separator = pathOrUrl.startsWith("/") ? "" : "/";
  return `${TEST_LOCAL_ORIGIN}${separator}${pathOrUrl}`;
}

export function testRequest(
  pathOrUrl: string,
  { host = TEST_LOCAL_HOST, headers, ...init }: TestRequestInit = {},
): Request {
  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("host")) {
    requestHeaders.set("host", host);
  }

  return new Request(resolveTestUrl(pathOrUrl), {
    ...init,
    headers: requestHeaders,
  });
}

export function localRequest(
  pathOrUrl: string,
  init?: TestRequestInit,
): Request {
  return testRequest(pathOrUrl, { ...init, host: init?.host ?? TEST_LOCAL_HOST });
}

export function nonLocalRequest(
  pathOrUrl: string,
  init?: TestRequestInit,
): Request {
  return testRequest(pathOrUrl, {
    ...init,
    host: init?.host ?? TEST_NON_LOCAL_HOST,
  });
}

export function jsonRequest(
  pathOrUrl: string,
  body: unknown,
  { method = "POST", headers, ...init }: TestRequestInit = {},
): Request {
  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("content-type")) {
    requestHeaders.set("content-type", "application/json");
  }

  return localRequest(pathOrUrl, {
    ...init,
    method,
    headers: requestHeaders,
    body: JSON.stringify(body),
  });
}
