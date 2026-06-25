import { APP_ROUTES } from "@/lib/routes/app-routes";

export const MAIN_CONTENT_ID = "main-content";

interface RouteAnnouncement {
  label: string;
  announcement: string;
}

const ROUTE_LABELS: Array<[prefix: string, label: string]> = [
  [APP_ROUTES.guidedBuilder, "Guided Skill Builder"],
  [`${APP_ROUTES.editor}/`, "Skill Editor"],
  [APP_ROUTES.editor, "New Skill"],
  [APP_ROUTES.skills, "Skills"],
  [APP_ROUTES.chat, "RAG Chat"],
  [APP_ROUTES.export, "Export"],
  [APP_ROUTES.settings, "Settings"],
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
