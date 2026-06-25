import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildLocalArtifactCleanupPlan,
  isSafeLocalArtifactPath,
  LOCAL_ARTIFACT_TARGETS,
} from "./cleanup-local-artifacts.mjs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const readme = readFileSync("README.md", "utf8");
const runbook = readFileSync("docs/v1-release/release-candidate-runbook.md", "utf8");
const source = readFileSync("scripts/cleanup-local-artifacts.mjs", "utf8");

assert.deepEqual(
  LOCAL_ARTIFACT_TARGETS,
  [".next", ".local-workspace", "tsconfig.tsbuildinfo"],
  "artifact cleanup must stay scoped to generated build and smoke outputs",
);

assert.equal(
  packageJson.scripts["cleanup:artifacts:dry-run"],
  "node scripts/cleanup-local-artifacts.mjs --dry-run",
  "package.json must expose artifact cleanup dry-run",
);

assert.equal(
  packageJson.scripts["cleanup:artifacts"],
  "node scripts/cleanup-local-artifacts.mjs --yes",
  "package.json must expose confirmed artifact cleanup",
);

assert.match(
  readme,
  /cleanup:artifacts:dry-run/,
  "README should document local artifact cleanup",
);

assert.match(
  runbook,
  /cleanup:artifacts:dry-run/,
  "release runbook should document local artifact cleanup",
);

assert.match(
  source,
  /pathToFileURL\(process\.argv\[1\]\)\.href/,
  "artifact cleanup CLI should use file URL entrypoint detection on Windows paths",
);

const root = await mkdtemp(path.join(os.tmpdir(), "artifact-cleanup-"));
try {
  await mkdir(path.join(root, ".next"));
  await mkdir(path.join(root, ".local-workspace"));
  await writeFile(path.join(root, "tsconfig.tsbuildinfo"), "cache", "utf8");
  await writeFile(path.join(root, ".env.local"), "ANTHROPIC_API_KEY=secret", "utf8");

  const plan = await buildLocalArtifactCleanupPlan(root);
  assert.deepEqual(
    plan.map((artifact) => artifact.relativePath).sort(),
    [".local-workspace", ".next", "tsconfig.tsbuildinfo"].sort(),
    "artifact cleanup should include only known generated files",
  );

  assert.equal(
    isSafeLocalArtifactPath(path.join(root, ".next"), root),
    true,
    "known build artifact should be safe",
  );
  assert.equal(
    isSafeLocalArtifactPath(path.join(root, ".env.local"), root),
    false,
    "local env files must never be treated as cleanup artifacts",
  );
  assert.equal(
    isSafeLocalArtifactPath(path.join(root, "node_modules"), root),
    false,
    "dependencies must never be treated as cleanup artifacts",
  );
  assert.equal(
    isSafeLocalArtifactPath(path.join(root, "..", ".next"), root),
    false,
    "artifact paths must stay inside the repo root",
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

console.log("Local artifact cleanup tests passed");
