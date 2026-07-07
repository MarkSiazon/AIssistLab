import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getSkillFilePath, getSkillsPath } from "@/lib/skills/reader";
import { isSafeSkillName } from "@/lib/skills/validation";

export interface DeletedSkillSummary {
  trashId: string;
  skillName: string;
  deletedAt: string;
  displayPath: string;
  workspaceKey: string;
}

// Opaque, privacy-safe fingerprint of the active skills directory. Scopes trash
// entries to their originating workspace without serializing any real path.
function currentWorkspaceKey(): string {
  const normalized = (() => {
    const resolved = path.resolve(getSkillsPath());
    return process.platform === "win32" ? resolved.toLowerCase() : resolved;
  })();
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

interface TrashManifest {
  deleted: DeletedSkillSummary[];
}

function trashRoot(): string {
  return (
    process.env.SKILL_TRASH_DIR ??
    path.join(process.cwd(), ".next", "cache", "skill-trash")
  );
}

function manifestPath(): string {
  return path.join(trashRoot(), "manifest.json");
}

function displayTrashPath(trashId: string): string {
  return `.next/cache/skill-trash/${trashId}.md`;
}

function isSafeTrashId(value: string): boolean {
  return /^\d+-[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(value);
}

async function readManifest(): Promise<TrashManifest> {
  try {
    const raw = await fs.readFile(manifestPath(), "utf-8");
    const parsed = JSON.parse(raw) as TrashManifest;
    return { deleted: Array.isArray(parsed.deleted) ? parsed.deleted : [] };
  } catch {
    return { deleted: [] };
  }
}

async function writeManifest(manifest: TrashManifest): Promise<void> {
  await fs.mkdir(trashRoot(), { recursive: true });
  await fs.writeFile(
    manifestPath(),
    JSON.stringify({ deleted: manifest.deleted.slice(0, 25) }, null, 2),
    "utf-8",
  );
}

export async function moveSkillToTrash(
  skillName: string,
): Promise<DeletedSkillSummary> {
  if (!isSafeSkillName(skillName)) throw new Error("Invalid skill name");
  const sourcePath = getSkillFilePath(skillName);
  if (!sourcePath) throw new Error("Invalid skill name");

  const deletedAt = new Date().toISOString();
  const trashId = `${Date.now()}-${skillName}`;
  const targetPath = path.join(trashRoot(), `${trashId}.md`);
  await fs.mkdir(trashRoot(), { recursive: true });
  await fs.rename(sourcePath, targetPath);

  const summary: DeletedSkillSummary = {
    trashId,
    skillName,
    deletedAt,
    displayPath: displayTrashPath(trashId),
    workspaceKey: currentWorkspaceKey(),
  };
  const manifest = await readManifest();
  await writeManifest({ deleted: [summary, ...manifest.deleted] });
  return summary;
}

function belongsToCurrentWorkspace(
  item: DeletedSkillSummary,
  workspaceKey: string,
): boolean {
  return item.workspaceKey === workspaceKey;
}

export async function getLatestDeletedSkill(
  skillName?: string,
): Promise<DeletedSkillSummary | null> {
  const manifest = await readManifest();
  const workspaceKey = currentWorkspaceKey();
  return (
    manifest.deleted.find(
      (item) =>
        belongsToCurrentWorkspace(item, workspaceKey) &&
        (!skillName || item.skillName === skillName),
    ) ?? null
  );
}

export async function restoreLatestDeletedSkill(
  skillName?: string,
): Promise<DeletedSkillSummary> {
  if (skillName && !isSafeSkillName(skillName)) {
    throw new Error("Invalid skill name");
  }
  const manifest = await readManifest();
  const workspaceKey = currentWorkspaceKey();
  const index = manifest.deleted.findIndex(
    (item) =>
      belongsToCurrentWorkspace(item, workspaceKey) &&
      (!skillName || item.skillName === skillName),
  );
  if (index === -1) throw new Error("No deleted skill available to restore");

  const summary = manifest.deleted[index];
  if (!isSafeTrashId(summary.trashId)) {
    throw new Error("Invalid trash entry");
  }
  const sourcePath = path.join(trashRoot(), `${summary.trashId}.md`);
  const targetPath = getSkillFilePath(summary.skillName);
  if (!targetPath) throw new Error("Invalid skill name");
  try {
    await fs.access(targetPath);
    throw new Error("Skill already exists and cannot be overwritten by restore");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      // Expected: restoring is safe only when the target file is absent.
    } else {
      throw error;
    }
  }
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.rename(sourcePath, targetPath);

  manifest.deleted.splice(index, 1);
  await writeManifest(manifest);
  return summary;
}
