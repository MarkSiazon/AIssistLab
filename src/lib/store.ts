import { SkillIndex } from "./rag/indexer";
import { readAllSkills } from "@/lib/skills/reader";
import { buildIndex } from "@/lib/rag/indexer";
import {
  getIndexStateStatus,
  markIndexFailed,
  markIndexReady,
  markIndexRebuilding,
  markIndexStale,
  type PublicIndexState,
} from "@/lib/rag/index-state";

// Module-level singleton — persists for the lifetime of the dev/prod server process
let cachedIndex: SkillIndex | null = null;
let rebuildPromise: Promise<SkillIndex> | null = null;

export async function getIndexStatus(): Promise<PublicIndexState> {
  return getIndexStateStatus();
}

export async function markIndexDirty(reason: string): Promise<PublicIndexState> {
  cachedIndex = null;
  return markIndexStale(reason);
}

export async function rebuildIndex(): Promise<PublicIndexState> {
  await markIndexRebuilding();

  try {
    const skills = await readAllSkills();
    const index = buildIndex(skills);
    cachedIndex = index;
    return await markIndexReady({
      skillCount: skills.length,
      chunkCount: index.chunks.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return markIndexFailed(message);
  }
}

export async function ensureFreshIndex(): Promise<SkillIndex> {
  const status = await getIndexStateStatus();
  if (cachedIndex && status.status === "ready") {
    return cachedIndex;
  }

  if (!rebuildPromise) {
    rebuildPromise = (async () => {
      const state = await rebuildIndex();
      if (state.status !== "ready") {
        throw new Error(state.error ?? "Unable to rebuild RAG index.");
      }

      if (!cachedIndex) {
        throw new Error("RAG index rebuild completed without an in-memory index.");
      }

      return cachedIndex;
    })().finally(() => {
      rebuildPromise = null;
    });
  }

  return rebuildPromise;
}
