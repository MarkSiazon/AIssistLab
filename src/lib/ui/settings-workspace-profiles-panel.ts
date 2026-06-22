export interface SettingsWorkspaceProfile {
  id: string;
  name: string;
  workspaceRoot: string;
  skillsDir: string;
}

export interface SettingsWorkspaceProfileStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const WORKSPACE_PROFILES_STORAGE_KEY =
  "rag-interface-workspace-profiles";

export interface SettingsWorkspaceProfileRow {
  id: string;
  name: string;
  workspaceDisplay: string;
  skillsDirDisplay: string;
  title: string;
}

function isWorkspaceProfile(value: unknown): value is SettingsWorkspaceProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<SettingsWorkspaceProfile>;

  return (
    typeof profile.id === "string" &&
    typeof profile.name === "string" &&
    typeof profile.workspaceRoot === "string" &&
    typeof profile.skillsDir === "string"
  );
}

export function parseSettingsWorkspaceProfiles(
  raw: string | null,
): SettingsWorkspaceProfile[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isWorkspaceProfile);
  } catch {
    return [];
  }
}

export function readSettingsWorkspaceProfilesFromStorage(
  storage: SettingsWorkspaceProfileStorage,
): SettingsWorkspaceProfile[] {
  try {
    return parseSettingsWorkspaceProfiles(
      storage.getItem(WORKSPACE_PROFILES_STORAGE_KEY),
    );
  } catch {
    return [];
  }
}

export function writeSettingsWorkspaceProfilesToStorage(
  storage: SettingsWorkspaceProfileStorage,
  profiles: readonly SettingsWorkspaceProfile[],
): boolean {
  try {
    storage.setItem(WORKSPACE_PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    return true;
  } catch {
    return false;
  }
}

export function buildSettingsWorkspaceProfile({
  id,
  name,
  workspaceRoot,
  skillsDir,
}: {
  id: string;
  name: string;
  workspaceRoot: string;
  skillsDir: string;
}): SettingsWorkspaceProfile {
  return {
    id,
    name: name.trim(),
    workspaceRoot,
    skillsDir: skillsDir || ".claude/skills",
  };
}

export function upsertSettingsWorkspaceProfile({
  profiles,
  profile,
}: {
  profiles: readonly SettingsWorkspaceProfile[];
  profile: SettingsWorkspaceProfile;
}): SettingsWorkspaceProfile[] {
  return [
    ...profiles.filter(
      (item) => item.name.toLowerCase() !== profile.name.toLowerCase(),
    ),
    profile,
  ];
}

export function deleteSettingsWorkspaceProfile({
  profiles,
  profileId,
}: {
  profiles: readonly SettingsWorkspaceProfile[];
  profileId: string;
}): SettingsWorkspaceProfile[] {
  return profiles.filter((profile) => profile.id !== profileId);
}

export function getSettingsWorkspaceProfileRows({
  profiles,
  formatPath,
}: {
  profiles: readonly SettingsWorkspaceProfile[];
  formatPath: (value: string) => string;
}): SettingsWorkspaceProfileRow[] {
  return profiles.map((profile) => {
    const workspaceDisplay = formatPath(profile.workspaceRoot);
    const skillsDirDisplay = formatPath(profile.skillsDir);

    return {
      id: profile.id,
      name: profile.name,
      workspaceDisplay,
      skillsDirDisplay,
      title: `${workspaceDisplay} | ${skillsDirDisplay}`,
    };
  });
}
