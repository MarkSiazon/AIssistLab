import { jsonError } from "@/lib/api/responses";

const LOOPBACK_AUTHORITY = /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/i;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

type RouteResult = Response | Promise<Response>;
type RouteHandler<Args extends unknown[] = []> = (
  request: Request,
  ...args: Args
) => RouteResult;

function getLocalOrigin(request: Request): string | null {
  const authority = request.headers.get("host");
  if (!authority || !LOOPBACK_AUTHORITY.test(authority)) return null;

  try {
    const { protocol } = new URL(request.url);
    if (protocol !== "http:" && protocol !== "https:") return null;
    return new URL(`${protocol}//${authority}`).origin;
  } catch {
    return null;
  }
}

function getBrowserRequestBlockReason(
  request: Request,
  localOrigin: string,
): string | null {
  const origin = request.headers.get("origin");
  if (origin !== null && origin !== localOrigin) {
    return "Local APIs require a same-origin browser request.";
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite !== null && fetchSite !== "same-origin" && fetchSite !== "none") {
    return "Local APIs reject cross-origin browser requests.";
  }

  // Native CLI clients omit browser metadata. Browser writes must prove their
  // exact origin instead of relying on Host, including the localhost port.
  if (fetchSite !== null && !SAFE_METHODS.has(request.method) && origin === null) {
    return "Local API browser changes require an Origin header.";
  }

  return null;
}

function getLocalCliBlockReason(request: Request): string | null {
  if (process.env.VERCEL) {
    return "Local Claude CLI is disabled on hosted deployments.";
  }

  if (process.env.NODE_ENV === "production") {
    return "Local Claude CLI is disabled in production mode.";
  }

  const localOrigin = getLocalOrigin(request);
  if (!localOrigin) {
    return "Local Claude CLI can only be used from localhost.";
  }

  return getBrowserRequestBlockReason(request, localOrigin);
}

function forbiddenJson(error: string): Response {
  return jsonError(error, 403);
}

export function forbidNonLocalCliRequest(request: Request): Response | null {
  const blockReason = getLocalCliBlockReason(request);
  return blockReason ? forbiddenJson(blockReason) : null;
}

function getLocalDeviceBlockReason(request: Request): string | null {
  if (process.env.VERCEL) {
    return "Local device access is disabled on hosted deployments.";
  }

  if (process.env.NODE_ENV === "production") {
    return "Local device access is disabled in production mode.";
  }

  const localOrigin = getLocalOrigin(request);
  if (!localOrigin) {
    return "Local device access can only be used from localhost.";
  }

  return getBrowserRequestBlockReason(request, localOrigin);
}

export function forbidNonLocalDeviceRequest(request: Request): Response | null {
  const blockReason = getLocalDeviceBlockReason(request);
  return blockReason ? forbiddenJson(blockReason) : null;
}

export function withLocalCliGuard<Args extends unknown[]>(
  handler: RouteHandler<Args>,
): RouteHandler<Args> {
  return (request, ...args) => {
    const forbidden = forbidNonLocalCliRequest(request);
    if (forbidden) return forbidden;
    return handler(request, ...args);
  };
}

export function withLocalDeviceGuard<Args extends unknown[]>(
  handler: RouteHandler<Args>,
): RouteHandler<Args> {
  return (request, ...args) => {
    const forbidden = forbidNonLocalDeviceRequest(request);
    if (forbidden) return forbidden;
    return handler(request, ...args);
  };
}
