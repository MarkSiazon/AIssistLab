import { jsonError } from "@/lib/api/responses";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

type RouteResult = Response | Promise<Response>;
type RouteHandler<Args extends unknown[] = []> = (
  request: Request,
  ...args: Args
) => RouteResult;

function getHostname(hostHeader: string | null): string {
  if (!hostHeader) return "";
  const host = hostHeader.trim().toLowerCase();

  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    return end === -1 ? host : host.slice(1, end);
  }

  return host.split(":")[0] ?? "";
}

export function isLocalRequest(request: Request): boolean {
  return LOCAL_HOSTS.has(getHostname(request.headers.get("host")));
}

export function getLocalCliBlockReason(request: Request): string | null {
  if (process.env.VERCEL) {
    return "Local Claude CLI is disabled on hosted deployments.";
  }

  if (process.env.NODE_ENV === "production") {
    return "Local Claude CLI is disabled in production mode.";
  }

  if (!isLocalRequest(request)) {
    return "Local Claude CLI can only be used from localhost.";
  }

  return null;
}

function forbiddenJson(error: string): Response {
  return jsonError(error, 403);
}

export function forbidNonLocalCliRequest(request: Request): Response | null {
  const blockReason = getLocalCliBlockReason(request);
  return blockReason ? forbiddenJson(blockReason) : null;
}

export function getLocalDeviceBlockReason(request: Request): string | null {
  if (process.env.VERCEL) {
    return "Local device access is disabled on hosted deployments.";
  }

  if (process.env.NODE_ENV === "production") {
    return "Local device access is disabled in production mode.";
  }

  if (!isLocalRequest(request)) {
    return "Local device access can only be used from localhost.";
  }

  return null;
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
