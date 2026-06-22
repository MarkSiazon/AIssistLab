export type RagIndexStateStatus =
  | "ready"
  | "stale"
  | "missing"
  | "rebuilding"
  | "failed";

export interface PersistedIndexState {
  status: Exclude<RagIndexStateStatus, "missing">;
  builtAt: string | null;
  updatedAt: string;
  skillCount: number;
  chunkCount: number;
  staleReason: string | null;
  error: string | null;
  workspaceFingerprint: string;
  skillsDirFingerprint: string;
  skillFilesFingerprint: string;
}

export interface PublicIndexState {
  status: RagIndexStateStatus;
  built: boolean;
  builtAt: string | null;
  skillCount: number;
  chunkCount: number;
  staleReason: string | null;
  workspaceDisplay: string;
  skillsDirDisplay: string;
  error: string | null;
}

export interface CurrentIndexConfig {
  workspaceRoot: string;
  skillsDir: string;
  skillsPath: string;
  workspaceFingerprint: string;
  skillsDirFingerprint: string;
  skillFilesFingerprint: string;
  workspaceDisplay: string;
  skillsDirDisplay: string;
}
