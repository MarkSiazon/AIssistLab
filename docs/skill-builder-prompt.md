Create a skill called auto-branch-analyzer-to-pr that generates a standardized PR title and description by analyzing all commits and diffs on the current branch compared to a base branch.

Put it in .claude/skills/. Make it accept $ARGUMENTS for the base branch (default to dev if not provided).

What the skill should do:

Detect the current branch name via git rev-parse --abbrev-ref HEAD

Accept an optional base branch argument (default: dev)

Gather context:

git log <base>..HEAD --pretty=format:"%h %s%n%b" --no-merges (commits + bodies)

git diff <base>..HEAD --stat (file-level changes)

git diff <base>..HEAD (full diff for understanding what actually changed)

Analyze everything and generate a PR with this exact consistent format:

## Title

<type>(<scope>): <short imperative description>

Type must be one of: feat, fix, refactor, chore, docs, test, perf, style, ci
Scope is derived from the primary area of change (e.g., settings, auth, api, ui)

## Summary

1-2 sentences max. What does this PR accomplish and why.

## Changes

### Added

- Bullet per new feature, file, or capability introduced
- Each bullet is one clear sentence, specific not vague

### Changed

- Bullet per modification to existing behavior or code
- Reference the actual file or module that changed

### Removed

- Bullet per deletion or deprecation (omit section if nothing removed)

### Fixed

- Bullet per bug fix (omit section if no fixes)

## Files Affected

- Group changed files by directory/module, collapsed list

## Testing Notes

- Specific things a reviewer should test or verify
- Based on what actually changed in the diff, not generic advice

Rules for the output:

Every bullet must be concrete and specific - no filler like "updated code" or "made improvements"

Derive bullets from the actual diff content, not just commit message summaries

If a commit message is vague (e.g., "wip", "fix stuff"), look at the diff to describe what really happened

Keep bullets to one line each, easy to skim

Omit any section (Added/Changed/Removed/Fixed) that has no items

Output as raw markdown ready to copy-paste into GitHub/GitLab PR form

Example usage:

/auto-branch-analyzer-to-pr -> compares current branch against dev

/auto-branch-analyzer-to-pr main -> compares against main

/auto-branch-analyzer-to-pr staging -> compares against staging

Edge cases to handle:

No commits ahead of base -> tell user there's nothing to compare

Base branch doesn't exist locally -> suggest git fetch origin <base>

Detached HEAD -> warn the user

Enormous diffs (50+ files) -> summarize by module/directory instead of per-file
