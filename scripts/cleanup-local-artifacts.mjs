#!/usr/bin/env node
import { rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

export const LOCAL_ARTIFACT_TARGETS = [
  ".next",
  ".local-workspace",
  "out",
  "build",
  "coverage",
  "tsconfig.tsbuildinfo",
  "next-env.d.ts",
];

function artifactPath(root, relativePath) {
  return path.resolve(root, relativePath);
}

export function isSafeLocalArtifactPath(targetPath, root = repoRoot) {
  const normalizedRoot = path.resolve(root);
  const normalizedTarget = path.resolve(targetPath);
  const relative = path.relative(normalizedRoot, normalizedTarget);

  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    return false;
  }

  return LOCAL_ARTIFACT_TARGETS.some(
    (target) => artifactPath(normalizedRoot, target) === normalizedTarget,
  );
}

export async function buildLocalArtifactCleanupPlan(root = repoRoot) {
  const normalizedRoot = path.resolve(root);
  const candidates = [];

  for (const relativePath of LOCAL_ARTIFACT_TARGETS) {
    const fullPath = artifactPath(normalizedRoot, relativePath);
    const fileStat = await stat(fullPath).catch((error) => {
      if (error && error.code === "ENOENT") return null;
      throw error;
    });
    if (!fileStat) continue;
    if (!isSafeLocalArtifactPath(fullPath, normalizedRoot)) {
      throw new Error(`Refusing unsafe artifact path: ${fullPath}`);
    }

    candidates.push({
      relativePath,
      fullPath,
      kind: fileStat.isDirectory() ? "directory" : "file",
      bytes: fileStat.size,
    });
  }

  return candidates;
}

async function removeArtifacts(plan) {
  for (const artifact of plan) {
    if (!isSafeLocalArtifactPath(artifact.fullPath)) {
      throw new Error(`Refusing unsafe artifact path: ${artifact.fullPath}`);
    }
    await rm(artifact.fullPath, { recursive: true, force: true });
  }
}

function formatArtifact(artifact) {
  return `${artifact.relativePath} (${artifact.kind})`;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run") || args.has("--list");
  const confirmed = args.has("--yes");

  if (!dryRun && !confirmed) {
    throw new Error("Refusing to delete artifacts without --yes. Use --dry-run to inspect.");
  }

  const plan = await buildLocalArtifactCleanupPlan(repoRoot);
  if (plan.length === 0) {
    console.log("No local build or smoke artifacts were found.");
    return;
  }

  console.log(`${dryRun ? "Would remove" : "Removing"} ${plan.length} local artifact(s):`);
  for (const artifact of plan) {
    console.log(`- ${formatArtifact(artifact)}`);
  }

  if (dryRun) {
    console.log("Dry run only. No files were removed.");
    return;
  }

  await removeArtifacts(plan);
  console.log("Local artifact cleanup complete.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
