import fs from "node:fs/promises";
import path from "node:path";
import type { PersistedIndexState } from "@/lib/rag/index-state-types";

const DEFAULT_CACHE_PATH = path.join(
  process.cwd(),
  ".next",
  "cache",
  "rag-index-state.json",
);

function getCachePath(): string {
  return process.env.RAG_INDEX_STATE_CACHE_PATH || DEFAULT_CACHE_PATH;
}

export async function clearPersistedIndexState(): Promise<void> {
  await fs.rm(getCachePath(), { force: true });
}

export async function readPersistedIndexState(): Promise<PersistedIndexState | null> {
  try {
    const raw = await fs.readFile(getCachePath(), "utf-8");
    return JSON.parse(raw) as PersistedIndexState;
  } catch {
    return null;
  }
}

export async function writePersistedIndexState(
  state: PersistedIndexState,
): Promise<void> {
  const cachePath = getCachePath();
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(cachePath, JSON.stringify(state, null, 2), "utf-8");
}
