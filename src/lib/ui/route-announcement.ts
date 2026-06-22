export const MAIN_CONTENT_ID = "main-content";

interface RouteAnnouncement {
  label: string;
  announcement: string;
}

const ROUTE_LABELS: Array<[prefix: string, label: string]> = [
  ["/editor/guided", "Guided Skill Builder"],
  ["/editor/", "Skill Editor"],
  ["/editor", "New Skill"],
  ["/skills", "Skills"],
  ["/chat", "RAG Chat"],
  ["/export", "Export"],
  ["/settings", "Settings"],
];

function normalizePathname(pathname: string | null): string {
  const value = pathname?.split(/[?#]/, 1)[0]?.trim() || "/";
  if (value.length > 1) return value.replace(/\/+$/, "");
  return value;
}

export function routeAnnouncementForPath(pathname: string | null): RouteAnnouncement {
  const normalized = normalizePathname(pathname);
  const match = ROUTE_LABELS.find(([prefix]) => {
    if (prefix.endsWith("/")) return normalized.startsWith(prefix);
    return normalized === prefix || normalized.startsWith(`${prefix}/`);
  });
  const label = match?.[1] ?? "Skill Workshop";

  return {
    label,
    announcement: `${label} loaded.`,
  };
}
