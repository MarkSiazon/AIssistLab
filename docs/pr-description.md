## Title

chore(workspace): harden Claude CLI V1 release workflow

## Summary

Hardens the Claude Code CLI workspace around the V1 release path by adding verified hook safety checks, current workspace documentation, parent-level release verification, and a refreshed PR-generation skill output flow.

## Changes

### Added

- `.claude/skills/auto-branch-analyzer-to-pr/SKILL.md` adds the active slash-command skill for generating PR descriptions from branch diffs.
- `.gitignore` keeps the separate nested `rag-interface/` repository, local env files, dependencies, build output, and temp artifacts out of parent workspace status.
- `.mcp.json` registers the project-local Context7 MCP server configuration.
- `AGENTS.md` documents local operating notes, change control, and verification expectations for this workspace.
- `README.md` documents the workspace layout, active skill, hook checks, parent verifier, nested V1 release command, manual QA gates, separate-repo policy, and current parent remote layout warning.
- `docs/README.md` indexes generated and planning artifacts under `docs/`.
- `docs/review-handoff.md` summarizes parent and nested V1 app changes, verified commands, remaining manual gates, current remote layout state, and commit/reconcile notes.
- `docs/skill-builder-prompt.md` preserves the source prompt for the active PR-generation skill.
- `scripts/verify-hooks.ps1` verifies hook syntax and the safety-gate allow/block matrix through Git Bash.
- `scripts/verify-workspace.ps1` runs parent hook, whitespace, untracked-text, and changed/untracked ASCII hygiene checks, nested static smoke checks, and an optional `-FullRelease` mode that runs the nested app's full V1 release verifier.

### Changed

- `.claude/hooks/safety-gate.sh` now handles whitespace-portable matching, blocks root delete variants, blocks protected-branch force pushes more precisely, and allows feature-branch force pushes that merely contain `main` or `master` in the name.
- `.claude/hooks/formatter.sh` and `.claude/hooks/reminder.sh` use ASCII-only comments and current workspace context.
- `.claude/hooks/reminder.sh` now points to the current workspace root, Next.js 16 app, active skill, and `npm run verify:release` command.
- `CLAUDE.md` points generated PR descriptions to `docs/pr-description.md`, removes stale warning-symbol text, and documents the current active skill behavior.
- `docs/pr-description.md` now describes the current parent workspace hardening diff instead of the older skill-only change.

### Removed

- Root `SKILL-BUILDER-PROMPT.MD` is replaced by `docs/skill-builder-prompt.md`.
- Root `pr-description.md` is replaced by `docs/pr-description.md`.

## Files Affected

- `.claude/hooks/`
  - `formatter.sh`
  - `reminder.sh`
  - `safety-gate.sh`
- `.claude/skills/auto-branch-analyzer-to-pr/`
  - `SKILL.md`
- `docs/`
  - `README.md`
  - `pr-description.md`
  - `review-handoff.md`
  - `skill-builder-prompt.md`
- `scripts/`
  - `verify-hooks.ps1`
  - `verify-workspace.ps1`
- Workspace root
  - `.gitignore`
  - `.mcp.json`
  - `AGENTS.md`
  - `CLAUDE.md`
  - `README.md`
  - `SKILL-BUILDER-PROMPT.MD`
  - `pr-description.md`

## Testing Notes

- Run `.\scripts\verify-hooks.ps1` from the parent workspace and confirm all hook syntax and safety-gate matrix cases pass.
- Run `.\scripts\verify-workspace.ps1` from the parent workspace and confirm parent hook/text/ASCII hygiene plus nested static smoke checks pass.
- Run `.\scripts\verify-workspace.ps1 -FullRelease` from the parent workspace and confirm the nested V1 `npm run verify:release` gate passes end to end.
- Confirm parent `git status --ignored --short rag-interface` reports `rag-interface/` as ignored, not untracked.
- Confirm manual QA remains documented for native folder picker visibility, visible Claude login launch, and real account-backed chat/auth.
