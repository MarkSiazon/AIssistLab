export {
  expandUserPath,
  sanitizeClaudeDisplayText,
  toPortableHomePath,
} from "@/lib/claude/discovery-paths";
export {
  buildClaudeExecutableCandidates,
  buildClaudeLoginCandidates,
} from "@/lib/claude/discovery-commands";
export {
  discoverClaudeProfileState,
  discoverClaudeProfiles,
  resolveClaudeProfileSelection,
} from "@/lib/claude/discovery-profiles";
export type {
  ClaudeCommandCandidate,
  ClaudeCommandSource,
  ClaudeInternalProfile,
  ClaudeProfileAuthState,
  ClaudeProfileSelectionInput,
  ClaudeProfileSource,
  ClaudeProfileState,
  ClaudeProfileSummary,
  DiscoverClaudeProfilesOptions,
  ResolvedClaudeProfileSelection,
} from "@/lib/claude/discovery-types";
