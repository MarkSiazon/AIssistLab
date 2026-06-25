---
name: auto-branch-analyzer-to-pr
description: Generate a standardized PR title and description by analyzing commits and diffs between the current branch and a base branch.
user-invokable: true
---

Generate a pull request title and description for the current branch.

**Base branch**: Use `$ARGUMENTS` as the base branch. If no argument is provided, default to `dev`.

## Step 1 - Detect current branch

Run:

```bash
git rev-parse --abbrev-ref HEAD
```

Handle these edge cases before proceeding:
- If the output is `HEAD`, warn the user they are in a detached HEAD state and stop.
- If the base branch does not exist locally, tell the user to run `git fetch origin <base>` and stop.

## Step 2 - Gather context

Run all three commands, replacing `<base>` with the resolved base branch:

```bash
git log <base>..HEAD --pretty=format:"%h %s%n%b" --no-merges
git diff <base>..HEAD --stat
git diff <base>..HEAD
```

- If `git log` returns no commits, tell the user there is nothing to compare against `<base>` and stop.
- If the diff spans 50+ files, summarize changes by directory/module instead of per-file.

## Step 3 - Commit hygiene check

Audit every commit message from the `git log` output against Conventional Commits format:

```text
<type>(<scope>): <description>
<type>: <description>
```

Valid types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `style`, `ci`, `build`, `revert`

If any commit messages are non-compliant, output this **before** the PR description:

```markdown
## Commit Hygiene Issues

The following commits do not follow Conventional Commits format:

- `<hash>` - "<message>" (reason: e.g., missing type prefix, imperative mood not used, too vague)

Consider squashing or rewording before merging.
```

If all commits are compliant, skip this section entirely.

## Step 4 - Generate PR description

Analyze the commits and full diff carefully. Derive all bullets from the **actual diff content**, not just commit messages. If a commit message is vague (e.g., "wip", "fix stuff"), look at the diff to determine what actually changed.

Output the following as raw markdown, ready to copy-paste into a GitHub or GitLab PR form:

---

## Title

`<type>(<scope>): <short imperative description>`

- **type** must be one of: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `style`, `ci`
- **scope** is derived from the primary area of change (e.g., `auth`, `api`, `ui`, `settings`)

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

- Bullet per deletion or deprecation

### Fixed

- Bullet per bug fix

## Files Affected

- Group changed files by directory/module as a collapsed list

## Testing Notes

- Specific things a reviewer should test or verify, based on what actually changed in the diff

---

Rules:
- Every bullet must be concrete and specific - no filler like "updated code" or "made improvements"
- Omit any section (Added / Changed / Removed / Fixed) that has no items
- Keep bullets to one line each, easy to skim

## Step 5 - Generate changelog entry

Using the same diff analysis, generate a [Keep a Changelog](https://keepachangelog.com/) entry. Map changes as follows:

- **Added** -> new features, files, endpoints, or capabilities
- **Changed** -> modifications to existing behavior, APIs, or UI
- **Deprecated** -> functionality still working but being phased out
- **Removed** -> deleted features, files, or options
- **Fixed** -> bug fixes
- **Security** -> vulnerability patches or auth/permission changes

Output format:

```markdown
## Changelog Entry

### [Unreleased]

#### Added
- ...

#### Changed
- ...

#### Fixed
- ...
```

Omit any subsection that has no items. Do not include a date. Bullets should be user-facing descriptions, not internal implementation details.

## Step 6 - Save and output

Write the PR description (Step 4 content only - not the hygiene report or changelog) to `docs/pr-description.md`. Then tell the user:

```text
PR description saved to docs/pr-description.md

To create the PR with GitHub CLI:
  gh pr create --title "<title>" --body-file docs/pr-description.md

To open an interactive PR form with the body pre-filled:
  gh pr create --body-file docs/pr-description.md --web
```

Print the changelog entry (Step 5) separately with this header:

```markdown
## Changelog Entry (add to CHANGELOG.md under [Unreleased])
```
