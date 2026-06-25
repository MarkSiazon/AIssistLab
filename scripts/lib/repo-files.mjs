import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(
  fileURLToPath(new URL("../../", import.meta.url)),
);

export function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "git command failed").trim());
  }
  return result.stdout;
}

export function normalizeRepoPath(value) {
  return value.replace(/\\/g, "/");
}

export function listedFilesFromGitOutput(output) {
  return output
    .split(/\r?\n/)
    .map((line) => normalizeRepoPath(line.trim()))
    .filter(Boolean);
}

export function filterExistingFiles(files, fileExists) {
  return files.filter((file) => fileExists(file));
}

export function listExistingTrackedAndVisibleUntrackedFiles() {
  const tracked = listedFilesFromGitOutput(runGit(["ls-files"]));
  const untracked = listedFilesFromGitOutput(
    runGit(["ls-files", "--others", "--exclude-standard"]),
  );
  const files = [...new Set([...tracked, ...untracked])].sort();
  return filterExistingFiles(files, (file) =>
    existsSync(path.join(repoRoot, file)),
  );
}

export function readRepoTextFile(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}
