import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const defaultManualQaIssue = "3";
const defaultNotesFile = "docs/v1-release/release-notes.md";

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  return {
    status: result.status ?? 1,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function requireSuccess(label, result) {
  if (result.status !== 0) {
    throw new Error(
      `${label} failed${result.stderr ? `: ${result.stderr}` : "."}`,
    );
  }
  return result.stdout;
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    manualQaSkipped: false,
    manualQaIssue: defaultManualQaIssue,
    notesFile: defaultNotesFile,
    tag: null,
    title: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--manual-qa-skipped") {
      options.manualQaSkipped = true;
    } else if (arg === "--manual-qa-issue") {
      options.manualQaIssue = argv[index + 1] ?? "";
      index += 1;
    } else if (arg === "--notes-file") {
      options.notesFile = argv[index + 1] ?? "";
      index += 1;
    } else if (arg === "--tag") {
      options.tag = argv[index + 1] ?? "";
      index += 1;
    } else if (arg === "--title") {
      options.title = argv[index + 1] ?? "";
      index += 1;
    } else if (arg === "--help") {
      options.help = true;
    } else {
      throw new Error(`Unknown release draft option: ${arg}`);
    }
  }

  return options;
}

function normalizeTag(tag) {
  const trimmed = tag?.trim() ?? "";
  if (!/^v\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(trimmed)) {
    throw new Error(
      "Release tag is required and must look like v1.0.0, v1.0.0-rc.1, or v1.0.0+build.1.",
    );
  }
  return trimmed;
}

export function buildReleaseDraftReadiness({
  branchLine,
  changedFileCount,
  headCommit,
  issueNumber = defaultManualQaIssue,
  issueState,
  localTagExists,
  manualQaSkipped = false,
  notesFile = defaultNotesFile,
  notesFileExists,
  originMainCommit,
  remoteTagExists,
  tag,
  title,
} = {}) {
  const errors = [];
  const normalizedTag = (() => {
    try {
      return normalizeTag(tag);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return tag ?? "";
    }
  })();
  const releaseTitle = title?.trim() || `Skill Workshop RAG ${normalizedTag}`;
  const prereleaseTag = /^v\d+\.\d+\.\d+-[0-9A-Za-z.-]+(?:\+[0-9A-Za-z.-]+)?$/.test(
    normalizedTag,
  );
  const manualQaPassed = issueState === "CLOSED";
  const draftPrerelease = manualQaSkipped && !manualQaPassed;

  if (!/^main(?:\.\.\.origin\/main)?$/.test(branchLine ?? "")) {
    errors.push("Release draft must be created from main tracking origin/main.");
  }

  if ((changedFileCount ?? 0) !== 0) {
    errors.push("Working tree must be clean before creating a release draft.");
  }

  if (!headCommit || !originMainCommit || headCommit !== originMainCommit) {
    errors.push("Local main must match origin/main before release drafting.");
  }

  if (!manualQaPassed) {
    if (!manualQaSkipped) {
      errors.push(
        `Manual QA issue #${issueNumber} must be closed before creating a release tag or draft, or pass --manual-qa-skipped for an automated-only draft prerelease.`,
      );
    } else if (!prereleaseTag) {
      errors.push(
        "Manual-QA-skipped releases must use a prerelease tag such as v1.0.0-rc.1.",
      );
    }
  }

  if (!notesFileExists) {
    errors.push("Release notes file was not found.");
  }

  if (localTagExists || remoteTagExists) {
    errors.push(`Release tag ${normalizedTag || "(missing)"} already exists.`);
  }

  return {
    ok: errors.length === 0,
    errors,
    tag: normalizedTag,
    title: releaseTitle,
    commands: [
      `git tag -a ${normalizedTag} -m "${releaseTitle}"`,
      `git push origin ${normalizedTag}`,
      `gh release create ${normalizedTag} --draft${draftPrerelease ? " --prerelease" : ""} --title "${releaseTitle}" --notes-file ${notesFile}`,
    ],
    draftPrerelease,
  };
}

function countChangedFiles(statusOutput) {
  return statusOutput
    .split(/\r?\n/)
    .slice(1)
    .filter(Boolean).length;
}

function usage() {
  return [
    "Usage:",
    "  npm run release:draft -- --tag v1.0.0 [--title \"Skill Workshop RAG v1.0.0\"] [--manual-qa-issue 3] [--notes-file docs/v1-release/release-notes.md] [--dry-run]",
    "  npm run release:draft -- --tag v1.0.0-rc.1 --manual-qa-skipped [--dry-run]",
    "",
    "The command refuses to create a final tag or GitHub draft release until the manual QA tracker issue is closed. Use --manual-qa-skipped only for automated-only draft prereleases with prerelease tags.",
  ].join("\n");
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const tag = normalizeTag(options.tag);
  const notesFile = options.notesFile?.trim() || defaultNotesFile;
  const statusOutput = requireSuccess(
    "git status",
    run("git", ["status", "--short", "--branch"]),
  );
  const branchLine = statusOutput.split(/\r?\n/)[0]?.replace(/^##\s*/, "") ?? "";
  const headCommit = requireSuccess(
    "git rev-parse HEAD",
    run("git", ["rev-parse", "HEAD"]),
  );
  const originMainCommit = requireSuccess(
    "git rev-parse origin/main",
    run("git", ["rev-parse", "origin/main"]),
  );
  const issueState = requireSuccess(
    `GitHub issue #${options.manualQaIssue} lookup`,
    run("gh", [
      "issue",
      "view",
      options.manualQaIssue,
      "--json",
      "state",
      "--jq",
      ".state",
    ]),
  );
  const localTagExists =
    run("git", ["rev-parse", "-q", "--verify", `refs/tags/${tag}`]).status === 0;
  const remoteTagExists = Boolean(
    requireSuccess(
      "git ls-remote tags",
      run("git", ["ls-remote", "--tags", "origin", `refs/tags/${tag}`]),
    ),
  );

  const readiness = buildReleaseDraftReadiness({
    branchLine,
    changedFileCount: countChangedFiles(statusOutput),
    headCommit,
    issueNumber: options.manualQaIssue,
    issueState,
    localTagExists,
    manualQaSkipped: options.manualQaSkipped,
    notesFileExists: existsSync(path.resolve(repoRoot, notesFile)),
    notesFile,
    originMainCommit,
    remoteTagExists,
    tag,
    title: options.title,
  });

  if (!readiness.ok) {
    console.error("Release draft is blocked:");
    for (const error of readiness.errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  if (options.dryRun) {
    console.log("Release draft is ready.");
    console.log("Planned commands:");
    for (const command of readiness.commands) {
      console.log(`- ${command}`);
    }
    return;
  }

  const releaseTitle = readiness.title;
  requireSuccess("git tag", run("git", ["tag", "-a", tag, "-m", releaseTitle]));
  requireSuccess("git push tag", run("git", ["push", "origin", tag]));
  requireSuccess(
    "GitHub draft release",
    run("gh", [
      "release",
      "create",
      tag,
      "--draft",
      ...(readiness.draftPrerelease ? ["--prerelease"] : []),
      "--title",
      releaseTitle,
      "--notes-file",
      notesFile,
    ]),
  );
  console.log(`Draft release created for ${tag}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
