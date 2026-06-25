# Autonomous Hardening Runbook

Use this runbook when an agent is asked to keep improving V1 without step-by-step user input. It is intentionally non-destructive and local-only.

## Goal

Autonomously harden Skill Workshop RAG for V1 release readiness: keep the app usable across Settings, Skills, Chat, Export, Editor, and Guided Builder; reduce duplicated code/docs where it is safe; preserve privacy; and verify every claim with repo-native evidence.

## Allowed Autonomous Work

- Inspect source, docs, scripts, tests, and current git state.
- Fix scoped UI action, button, navigation, accessibility, readiness, export, index, and diagnostics bugs.
- Refactor duplicated helpers when the result is smaller, clearer, and covered by tests.
- Move detailed documentation into `docs/` and keep `README.md` focused on onboarding and primary commands.
- Add or update deterministic tests, smoke checks, and privacy scans.
- Run local test, lint, build, smoke, audit, and diff checks.

## Stop Conditions

Stop and report instead of guessing when work requires:

- Real API keys, paid provider usage, or private account access.
- Interactive Claude login or `Open Login` confirmation.
- Native OS folder picker visibility confirmation.
- Destructive filesystem cleanup outside app-controlled temp fixtures.
- Commit or push approval.
- Product decisions that change V1 scope or introduce V2 provider registry behavior.

## Working Loop

1. Inspect current branch and dirty worktree.
2. Read relevant docs under `docs/` before editing behavior.
3. Search for concrete risks with `rg`, such as unsafe navigation, missing button types, broken internal links, duplicated ids, unfinished-work markers, raw paths, or direct secret output.
4. Patch only findings that are currently in scope and backed by evidence.
5. Add or update targeted tests for each behavior change.
6. Run focused tests first, then `npm run verify:release`.
7. Inspect `git diff --stat`, `git diff --check`, and relevant file diffs.
8. Report evidence, unresolved manual checks, and whether commit or push approval is still needed.

## Required Evidence

For a strong autonomous pass, capture:

- `git status --short --branch`
- targeted test names and results for patched areas
- `npm run verify:release`
- final `git diff --stat`
- privacy scan result from the release gate
- explicit residual manual QA items

## Manual-Only QA

The automated gate intentionally does not prove these:

- native OS folder picker is visibly opened by the desktop/browser shell
- `Open Login` launches a visible terminal or auth flow for the selected profile
- real account-backed API or Claude CLI chat succeeds with a private account

Track those in the [release-candidate runbook manual QA section](release-candidate-runbook.md#manual-external-qa).
