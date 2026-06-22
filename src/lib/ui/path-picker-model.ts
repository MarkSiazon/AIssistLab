export interface BrowseEntry {
  name: string;
  fullPath: string;
  type: "drive" | "dir";
}

export interface BrowseResult {
  path: string;
  parent: string | null;
  label: string;
  entries: BrowseEntry[];
  isRoot: boolean;
  error?: string;
}

export interface PathCrumb {
  label: string;
  path: string;
}

export interface PathPickerNotice {
  tone: "info" | "error";
  message: string;
}

export function normalizeInputPath(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "");
}

export function splitBreadcrumbs(pathValue: string): PathCrumb[] {
  if (!pathValue) return [];

  const normalised = pathValue.replace(/\\/g, "/");
  const parts = normalised.split("/").filter(Boolean);
  const crumbs: PathCrumb[] = [];

  if (normalised.startsWith("/")) {
    let running = "/";
    crumbs.push({ label: "/", path: running });

    parts.forEach((part) => {
      running = running === "/" ? `/${part}` : `${running}/${part}`;
      crumbs.push({ label: part, path: running });
    });

    return crumbs;
  }

  let running = "";

  parts.forEach((part, index) => {
    if (index === 0 && /^[A-Za-z]:$/.test(part)) {
      running = `${part}\\`;
      crumbs.push({ label: `${part}\\`, path: running });
      return;
    }

    running = running ? `${running.replace(/\\$/, "")}\\${part}` : part;
    crumbs.push({ label: part, path: running });
  });

  return crumbs;
}

export function compactPath(pathValue: string): string {
  if (pathValue.length <= 52) return pathValue;
  const parts = pathValue.replace(/\\/g, "/").split("/").filter(Boolean);
  if (parts.length <= 3) return pathValue;
  return `${parts[0]}\\...\\${parts.slice(-2).join("\\")}`;
}
