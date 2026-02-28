## Title

feat(skills): add auto-branch-analyzer-to-pr slash command skill

## Summary

Introduces the `auto-branch-analyzer-to-pr` Claude Code skill — a 6-step slash command that analyzes branch commits and diffs to generate a structured PR title, description, and changelog entry, then saves the output to a file.

## Changes

### Added

- `.claude/skills/auto-branch-analyzer-to-pr/SKILL.md` — new skill file implementing a 6-step PR generation workflow
- Step 1: detects current branch and handles edge cases (detached HEAD, missing base branch)
- Step 2: gathers `git log`, `git diff --stat`, and `git diff` against a configurable base branch (defaults to `dev`)
- Step 3: audits commit messages against Conventional Commits format; outputs a hygiene report for non-compliant commits
- Step 4: generates a structured PR description (Title, Summary, Changes, Files Affected, Testing Notes) derived from actual diff content — not commit messages
- Step 5: generates a Keep a Changelog `[Unreleased]` block from the same diff analysis
- Step 6: saves the PR description to `pr-description.md` and prints `gh pr create` commands

## Files Affected

- `.claude/skills/auto-branch-analyzer-to-pr/`
  - `SKILL.md`

## Testing Notes

- Run `/auto-branch-analyzer-to-pr` with no args — verify it defaults to `dev` as the base
- Run `/auto-branch-analyzer-to-pr main` — verify it compares against `main`
- Test on a detached HEAD — skill should warn and stop
- Test with a base branch not fetched locally — skill should suggest `git fetch origin <base>`
- Test on a branch with no commits ahead of base — skill should report nothing to compare
- Verify the hygiene report appears when commit messages don't follow Conventional Commits
