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
  ClaudeCommandSource,
  ClaudeInternalProfile,
  ClaudeProfileAuthState,
  ClaudeProfileSelectionInput,
  ClaudeProfileSummary,
  ResolvedClaudeProfileSelection,
} from "@/lib/claude/discovery-types";
