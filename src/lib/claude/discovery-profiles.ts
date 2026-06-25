import { createHmac, randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  discoveredProfileDisplayPath,
  expandUserPath,
  isWindowsLikePath,
  joinNearHome,
  pathApiFor,
  sanitizeClaudeDisplayText,
  sanitizeManualProfileDisplayPath,
  toPortableHomePath,
} from "@/lib/claude/discovery-paths";
import type {
  ClaudeInternalProfile,
  ClaudeProfileAuthState,
  ClaudeProfileSelectionInput,
  ClaudeProfileState,
  ClaudeProfileSummary,
  DiscoverClaudeProfilesOptions,
  ResolvedClaudeProfileSelection,
} from "@/lib/claude/discovery-types";

const DEFAULT_AUTH_STATE: ClaudeProfileAuthState = {
  checked: false,
  loggedIn: null,
  method: null,
  error: null,
};

const globalClaudeProfileIds = globalThis as typeof globalThis & {
  __CLAUDE_PROFILE_ID_SECRET?: string;
};

if (process.env.CLAUDE_PROFILE_ID_SECRET) {
  globalClaudeProfileIds.__CLAUDE_PROFILE_ID_SECRET =
    process.env.CLAUDE_PROFILE_ID_SECRET;
} else {
  globalClaudeProfileIds.__CLAUDE_PROFILE_ID_SECRET ??=
    randomBytes(16).toString("hex");
}

const PROFILE_ID_SECRET = globalClaudeProfileIds.__CLAUDE_PROFILE_ID_SECRET;

async function defaultExists(candidate: string): Promise<boolean> {
  try {
    await fs.access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function defaultReadDirNames(candidate: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(candidate, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

function pathsEqual(
  left: string,
  right: string,
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
): boolean {
  const expandedLeft = expandUserPath(left, env);
  const expandedRight = expandUserPath(right, env);
  const api = isWindowsLikePath(`${expandedLeft}${expandedRight}`)
    ? path.win32
    : path.posix;
  const normalizedLeft = api.normalize(expandedLeft).replace(/[\\/]+$/, "");
  const normalizedRight = api.normalize(expandedRight).replace(/[\\/]+$/, "");
  return isWindowsLikePath(`${normalizedLeft}${normalizedRight}`)
    ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
    : normalizedLeft === normalizedRight;
}

function hashProfileId(value: string): string {
  return createHmac("sha256", PROFILE_ID_SECRET)
    .update(value.toLowerCase())
    .digest("hex")
    .slice(0, 16);
}

function profileAuth(auth?: Partial<ClaudeProfileAuthState>): ClaudeProfileAuthState {
  return { ...DEFAULT_AUTH_STATE, ...auth };
}

function publicProfile(profile: ClaudeInternalProfile): ClaudeProfileSummary {
  return {
    id: profile.id,
    label: profile.label,
    source: profile.source,
    displayPath: profile.displayPath,
    selected: profile.selected,
    exists: profile.exists,
    auth: profile.auth,
  };
}

async function buildManualProfile(
  configured: string,
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
  exists: (candidate: string) => Promise<boolean>,
): Promise<ClaudeInternalProfile> {
  const expanded = expandUserPath(configured, env);
  const portableConfigDir = toPortableHomePath(expanded, env);
  return {
    id: "manual",
    label: "Manual profile",
    source: "manual",
    displayPath: sanitizeManualProfileDisplayPath(expanded, env),
    selected: true,
    exists: await exists(expanded),
    auth: profileAuth(),
    absoluteConfigDir: expanded,
    portableConfigDir,
    filesystemPath: expanded,
  };
}

export async function discoverClaudeProfileState({
  configuredConfigDir,
  env = process.env,
  exists = defaultExists,
  readDirNames = defaultReadDirNames,
}: DiscoverClaudeProfilesOptions = {}): Promise<ClaudeProfileState> {
  const configured = configuredConfigDir?.trim() ?? "";
  const defaultProfilePath = joinNearHome(env, ".claude");
  const profileRoot = joinNearHome(env, ".claude-profiles");
  const selectedIsDefault =
    !configured || pathsEqual(configured, defaultProfilePath, env);

  const internalProfiles: ClaudeInternalProfile[] = [
    {
      id: "default",
      label: "Default profile",
      source: "default",
      displayPath: sanitizeClaudeDisplayText(
        toPortableHomePath(defaultProfilePath, env),
        env,
      ),
      selected: selectedIsDefault,
      exists: await exists(defaultProfilePath),
      auth: profileAuth(),
      absoluteConfigDir: null,
      portableConfigDir: "",
      filesystemPath: defaultProfilePath,
    },
  ];

  const profileNames = (await readDirNames(profileRoot)).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );

  for (let index = 0; index < profileNames.length; index += 1) {
    const profileName = profileNames[index];
    const profilePath = pathApiFor(profileRoot).join(profileRoot, profileName);
    const portableConfigDir = toPortableHomePath(profilePath, env);
    internalProfiles.push({
      id: `profile-${hashProfileId(profilePath)}`,
      label: `Profile ${index + 1}`,
      source: "discovered",
      displayPath: discoveredProfileDisplayPath(env),
      selected: Boolean(configured && pathsEqual(configured, profilePath, env)),
      exists: await exists(profilePath),
      auth: profileAuth(),
      absoluteConfigDir: profilePath,
      portableConfigDir,
      filesystemPath: profilePath,
    });
  }

  if (configured && internalProfiles.every((profile) => !profile.selected)) {
    internalProfiles.push(await buildManualProfile(configured, env, exists));
  }

  const profiles = internalProfiles.map(publicProfile);
  const selectedInternalProfile =
    internalProfiles.find((profile) => profile.selected) ?? internalProfiles[0];
  const selectedProfile = publicProfile(selectedInternalProfile);

  return {
    profiles,
    selectedProfile,
    internalProfiles,
    selectedInternalProfile,
  };
}

export async function discoverClaudeProfiles(
  options: DiscoverClaudeProfilesOptions = {},
): Promise<ClaudeProfileSummary[]> {
  const state = await discoverClaudeProfileState(options);
  return state.profiles;
}

export async function resolveClaudeProfileSelection(
  selection: ClaudeProfileSelectionInput | undefined,
  options: DiscoverClaudeProfilesOptions = {},
): Promise<ResolvedClaudeProfileSelection> {
  const state = await discoverClaudeProfileState(options);
  const manualConfigDir = selection?.manualConfigDir?.trim();

  if (manualConfigDir) {
    const exists = options.exists ?? defaultExists;
    const env = options.env ?? process.env;
    const manualInternalProfile = await buildManualProfile(
      manualConfigDir,
      env,
      exists,
    );
    const internalProfiles = state.internalProfiles
      .map((profile) => ({ ...profile, selected: false }))
      .concat(manualInternalProfile);
    const profiles = internalProfiles.map(publicProfile);
    const publicManualProfile = publicProfile(manualInternalProfile);
    return {
      profiles,
      selectedProfile: publicManualProfile,
      internalProfiles,
      selectedInternalProfile: manualInternalProfile,
      publicProfile: publicManualProfile,
      internalProfile: manualInternalProfile,
    };
  }

  const selectedId = selection?.profileId?.trim();
  const internalProfile = selectedId
    ? state.internalProfiles.find((profile) => profile.id === selectedId)
    : state.selectedInternalProfile;

  if (!internalProfile) {
    throw new Error("Selected Claude profile is no longer available.");
  }

  const selectedInternalProfile = { ...internalProfile, selected: true };
  const internalProfiles = state.internalProfiles.map((profile) => ({
    ...profile,
    selected: profile.id === selectedInternalProfile.id,
  }));
  const profiles = internalProfiles.map(publicProfile);
  const publicSelectedProfile = publicProfile(selectedInternalProfile);
  return {
    profiles,
    selectedProfile: publicSelectedProfile,
    internalProfiles,
    selectedInternalProfile,
    publicProfile: publicSelectedProfile,
    internalProfile: selectedInternalProfile,
  };
}
