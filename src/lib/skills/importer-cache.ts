import fs from "node:fs/promises";
import path from "node:path";
import type { StoredPreview } from "./importer-types";

function previewCachePath(): string {
  return (
    process.env.SKILL_IMPORT_PREVIEW_CACHE_PATH ??
    path.join(process.cwd(), ".next", "cache", "skill-import-previews.json")
  );
}

export async function readImportPreviewCache(): Promise<
  Record<string, StoredPreview>
> {
  try {
    return JSON.parse(await fs.readFile(previewCachePath(), "utf-8")) as Record<
      string,
      StoredPreview
    >;
  } catch {
    return {};
  }
}

export async function writeImportPreviewCache(
  cache: Record<string, StoredPreview>,
): Promise<void> {
  const entries = Object.entries(cache).slice(-25);
  await fs.mkdir(path.dirname(previewCachePath()), { recursive: true });
  await fs.writeFile(
    previewCachePath(),
    JSON.stringify(Object.fromEntries(entries), null, 2),
    "utf-8",
  );
}
