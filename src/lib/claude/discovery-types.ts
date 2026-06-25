export type ClaudeCommandSource =
  | "env"
  | "native-install"
  | "sibling"
  | "user-bin"
  | "path"
  | "missing";

type ClaudeProfileSource = "default" | "discovered" | "manual";

export interface ClaudeCommandCandidate {
  command: string;
  displayCommand: string;
  source: Exclude<ClaudeCommandSource, "missing">;
}

export interface ClaudeProfileAuthState {
  checked: boolean;
  loggedIn: boolean | null;
  method: string | null;
  error: string | null;
}

export interface ClaudeProfileSummary {
  id: string;
  label: string;
  source: ClaudeProfileSource;
  displayPath: string;
  selected: boolean;
  exists: boolean;
  auth: ClaudeProfileAuthState;
}

export interface ClaudeInternalProfile extends ClaudeProfileSummary {
  absoluteConfigDir: string | null;
  portableConfigDir: string;
  filesystemPath: string;
}

export interface ClaudeProfileState {
  profiles: ClaudeProfileSummary[];
  selectedProfile: ClaudeProfileSummary;
  internalProfiles: ClaudeInternalProfile[];
  selectedInternalProfile: ClaudeInternalProfile;
}

export interface ClaudeProfileSelectionInput {
  profileId?: string | null;
  manualConfigDir?: string | null;
}

export interface ResolvedClaudeProfileSelection extends ClaudeProfileState {
  publicProfile: ClaudeProfileSummary;
  internalProfile: ClaudeInternalProfile;
}

export interface DiscoverClaudeProfilesOptions {
  configuredConfigDir?: string | null;
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
  exists?: (candidate: string) => Promise<boolean>;
  readDirNames?: (candidate: string) => Promise<string[]>;
}
