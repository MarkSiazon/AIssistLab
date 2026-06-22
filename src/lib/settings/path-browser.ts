import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export type PathBrowserEntryType = "drive" | "dir";

export interface PathBrowserEntry {
  name: string;
  fullPath: string;
  type: PathBrowserEntryType;
}

export interface PathBrowseResult {
  path: string;
  parent: string | null;
  label: string;
  entries: PathBrowserEntry[];
  isRoot: boolean;
  error?: string;
}

export interface PathSearchMatch {
  fullPath: string;
  parent: string;
  label: string;
}

export interface PathSearchResult {
  name: string;
  matches: PathSearchMatch[];
}

type DriveAccess = (drivePath: string) => Promise<void>;

export interface BrowsePathOptions {
  platform?: NodeJS.Platform;
  homeDir?: string;
  listDrives?: () => Promise<string[]>;
}

export interface SearchDirectoriesOptions {
  roots?: string[];
  platform?: NodeJS.Platform;
  homeDir?: string;
  maxDepth?: number;
  listDrives?: () => Promise<string[]>;
}

const IGNORED_SEARCH_DIRS = new Set([
  "node_modules",
  ".git",
  "windows",
  "program files",
  "program files (x86)",
]);

export async function listWindowsDrives(
  accessDrive: DriveAccess = async (drivePath) => {
    await fs.access(drivePath);
  },
): Promise<string[]> {
  const drives: string[] = [];
  for (let code = 65; code <= 90; code++) {
    const letter = String.fromCharCode(code);
    const drivePath = `${letter}:\\`;
    try {
      await accessDrive(drivePath);
      drives.push(drivePath);
    } catch {
      /* not accessible */
    }
  }
  return drives;
}

function isWindowsRootRequest(
  requestedPath: string,
  platform: NodeJS.Platform,
): boolean {
  return (
    platform === "win32" &&
    (!requestedPath || requestedPath === "\\" || requestedPath === "/")
  );
}

function isWindowsDriveRoot(value: string, platform: NodeJS.Platform): boolean {
  return platform === "win32" && /^[A-Z]:\\?$/i.test(value);
}

function visibleDirectoryEntry(entry: { isDirectory(): boolean; name: string }) {
  return (
    entry.isDirectory() &&
    (!entry.name.startsWith(".") || entry.name === ".claude")
  );
}

export async function browsePath(
  requestedPath: string,
  {
    platform = os.platform(),
    homeDir = os.homedir(),
    listDrives = () => listWindowsDrives(),
  }: BrowsePathOptions = {},
): Promise<PathBrowseResult> {
  const reqPath = requestedPath.trim();

  if (isWindowsRootRequest(reqPath, platform)) {
    const drives = await listDrives();
    return {
      path: "",
      parent: null,
      label: "This PC",
      entries: drives.map((drivePath) => ({
        name: drivePath,
        fullPath: drivePath,
        type: "drive",
      })),
      isRoot: true,
    };
  }

  const resolvedPath = reqPath || homeDir;

  try {
    const stat = await fs.stat(resolvedPath);
    if (!stat.isDirectory()) {
      return {
        path: resolvedPath,
        parent: null,
        label: resolvedPath,
        entries: [],
        isRoot: false,
        error: "Not a directory",
      };
    }
  } catch {
    return {
      path: resolvedPath,
      parent: null,
      label: resolvedPath,
      entries: [],
      isRoot: false,
      error: "Path not found",
    };
  }

  let entries: PathBrowserEntry[] = [];
  try {
    const dirents = await fs.readdir(resolvedPath, { withFileTypes: true });
    entries = dirents
      .filter(visibleDirectoryEntry)
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      )
      .map((entry) => ({
        name: entry.name,
        fullPath: path.join(resolvedPath, entry.name),
        type: "dir",
      }));
  } catch {
    entries = [];
  }

  const parsedParent = path.dirname(resolvedPath);
  const parent = isWindowsDriveRoot(resolvedPath, platform)
    ? ""
    : parsedParent === resolvedPath
      ? null
      : parsedParent;

  return {
    path: resolvedPath,
    parent,
    label: path.basename(resolvedPath) || resolvedPath,
    entries,
    isRoot: false,
  };
}

async function listSubdirectories(parent: string): Promise<string[]> {
  try {
    const dirents = await fs.readdir(parent, { withFileTypes: true });
    return dirents
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(parent, entry.name));
  } catch {
    return [];
  }
}

async function defaultSearchRoots({
  platform = os.platform(),
  homeDir = os.homedir(),
  listDrives = () => listWindowsDrives(),
}: SearchDirectoriesOptions): Promise<string[]> {
  if (platform === "win32") return listDrives();
  return ["/", homeDir];
}

export async function searchDirectoriesByName(
  name: string,
  options: SearchDirectoriesOptions = {},
): Promise<PathSearchResult> {
  const roots = options.roots ?? (await defaultSearchRoots(options));
  const maxDepth = options.maxDepth ?? 3;
  const nameLower = name.toLowerCase();
  const matches: string[] = [];

  async function recurse(dir: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;
    const children = await listSubdirectories(dir);
    await Promise.all(
      children.map(async (child) => {
        const base = path.basename(child).toLowerCase();
        if (base === nameLower) {
          matches.push(child);
          return;
        }
        if (IGNORED_SEARCH_DIRS.has(base)) return;
        await recurse(child, depth + 1);
      }),
    );
  }

  await Promise.all(roots.map((root) => recurse(root, 1)));

  return {
    name,
    matches: matches.sort().map((match) => ({
      fullPath: match,
      parent: path.dirname(match),
      label: match,
    })),
  };
}
