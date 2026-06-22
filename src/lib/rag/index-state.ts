import {
  clearPersistedIndexState as clearIndexStateCache,
  readPersistedIndexState,
  writePersistedIndexState,
} from "@/lib/rag/index-state-cache";
import { getCurrentIndexConfig } from "@/lib/rag/index-state-config";
import { sanitizeError } from "@/lib/rag/index-state-display";
import { toPublicIndexState } from "@/lib/rag/index-state-public";
import type {
  PublicIndexState,
  RagIndexStateStatus,
} from "@/lib/rag/index-state-types";

export type { PublicIndexState, RagIndexStateStatus };

export async function clearPersistedIndexState(): Promise<void> {
  await clearIndexStateCache();
}

export async function getIndexStateStatus(): Promise<PublicIndexState> {
  const [config, persisted] = await Promise.all([
    getCurrentIndexConfig(),
    readPersistedIndexState(),
  ]);
  return toPublicIndexState(persisted, config);
}

export async function markIndexRebuilding(): Promise<PublicIndexState> {
  const config = await getCurrentIndexConfig();
  const now = new Date().toISOString();
  await writePersistedIndexState({
    status: "rebuilding",
    builtAt: null,
    updatedAt: now,
    skillCount: 0,
    chunkCount: 0,
    staleReason: null,
    error: null,
    workspaceFingerprint: config.workspaceFingerprint,
    skillsDirFingerprint: config.skillsDirFingerprint,
    skillFilesFingerprint: config.skillFilesFingerprint,
  });
  return getIndexStateStatus();
}

export async function markIndexReady(input: {
  skillCount: number;
  chunkCount: number;
}): Promise<PublicIndexState> {
  const config = await getCurrentIndexConfig();
  const now = new Date().toISOString();
  await writePersistedIndexState({
    status: "ready",
    builtAt: now,
    updatedAt: now,
    skillCount: input.skillCount,
    chunkCount: input.chunkCount,
    staleReason: null,
    error: null,
    workspaceFingerprint: config.workspaceFingerprint,
    skillsDirFingerprint: config.skillsDirFingerprint,
    skillFilesFingerprint: config.skillFilesFingerprint,
  });
  return getIndexStateStatus();
}

export async function markIndexStale(reason: string): Promise<PublicIndexState> {
  const config = await getCurrentIndexConfig();
  const existing = await readPersistedIndexState();
  const now = new Date().toISOString();
  await writePersistedIndexState({
    status: "stale",
    builtAt: existing?.builtAt ?? null,
    updatedAt: now,
    skillCount: existing?.skillCount ?? 0,
    chunkCount: existing?.chunkCount ?? 0,
    staleReason: sanitizeError(reason),
    error: null,
    workspaceFingerprint: config.workspaceFingerprint,
    skillsDirFingerprint: config.skillsDirFingerprint,
    skillFilesFingerprint: config.skillFilesFingerprint,
  });
  return getIndexStateStatus();
}

export async function markIndexFailed(error: string): Promise<PublicIndexState> {
  const config = await getCurrentIndexConfig();
  const existing = await readPersistedIndexState();
  const now = new Date().toISOString();
  await writePersistedIndexState({
    status: "failed",
    builtAt: existing?.builtAt ?? null,
    updatedAt: now,
    skillCount: existing?.skillCount ?? 0,
    chunkCount: existing?.chunkCount ?? 0,
    staleReason: null,
    error: sanitizeError(error),
    workspaceFingerprint: config.workspaceFingerprint,
    skillsDirFingerprint: config.skillsDirFingerprint,
    skillFilesFingerprint: config.skillFilesFingerprint,
  });
  return getIndexStateStatus();
}
