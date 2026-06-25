# Review Handoff

Updated: 2026-06-25, Asia/Manila

This handoff summarizes the current uncommitted workspace state for review. The parent workspace and `rag-interface/` are separate Git repositories in this checkout.

## Parent Workspace

Branch: `dev`

Remote state: after `git fetch --all --prune`, `origin/dev` and `origin/feat/auto-branch-analyzer-skill` are gone. The remaining `origin/main` points at the V1 app-root history (`9484f0a`, `fix(release): harden local QA and Claude login`), not the current parent wrapper layout. Local `dev` is an ancestor of `origin/main`, but the trees have different roots: parent `HEAD` contains `.claude/`, `CLAUDE.md`, and legacy root docs, while `origin/main` contains the app files that are also present locally under `rag-interface/`.

Parent changes:

- Added `.claude/skills/auto-branch-analyzer-to-pr/SKILL.md`.
- Added `.gitignore` so the separate nested `rag-interface/` repo, local env files, dependencies, build output, and temp artifacts stay out of parent status.
- Added `.mcp.json` for project-local Context7 MCP config.
- Added `AGENTS.md` with local repo operating notes.
- Added `README.md` with layout, active skill, hook verification, parent workspace verification, nested V1 release verification, manual QA gates, and Git notes.
- Added `docs/README.md`, `docs/pr-description.md`, `docs/skill-builder-prompt.md`, and this review handoff.
- Added `scripts/verify-hooks.ps1` for Git Bash hook syntax checks and safety-gate matrix coverage.
- Added `scripts/verify-workspace.ps1` with parent text/ASCII hygiene checks, fast nested static checks, and `-FullRelease` mode.
- Updated `.claude/hooks/formatter.sh`, `.claude/hooks/reminder.sh`, `.claude/hooks/safety-gate.sh`, and `CLAUDE.md`.
- Removed stale root `SKILL-BUILDER-PROMPT.MD` and root `pr-description.md` in favor of `docs/`.

Parent verification:

```powershell
.\scripts\verify-hooks.ps1
.\scripts\verify-workspace.ps1
.\scripts\verify-workspace.ps1 -FullRelease
```

Latest verified result:

- `.\scripts\verify-workspace.ps1 -FullRelease` passed.
- Parent ASCII scan passed.
- Parent secret scan only matched policy wording in docs.
- Parent `verify-workspace.ps1` now includes changed/untracked ASCII hygiene and extensionless text coverage, including `.gitignore`.
- Scoped process scan found no repo-owned `rag-interface` Node processes left running.

## Nested V1 App

Path: `rag-interface/`

Branch: `main`

Nested changes:

- `scripts/smoke-local.mjs` no longer expects `Restore smoke-imported-skill` to remain visible after restore succeeds.
- `scripts/smoke-local.mjs` uses rendered text instead of network idle for retryable route loads, retries first-run navigation actions with URL assertions, scopes Manual QA evidence clicks to one row, and retries the settings import file chooser handshake.
- `scripts/smoke/smoke-local-static.test.mjs` keeps coverage that restore is clicked while preventing the stale visible-button expectation from returning.
- `src/lib/settings/client-api.test.ts` covers sanitized field/raw settings save failures deterministically after removing the flaky browser-level save-failure mock from the broad local smoke.
- `scripts/smoke-buttons.mjs` waits for expected route text to become visible before collecting safe buttons.
- `scripts/smoke/smoke-buttons-static.test.mjs` guards the wait-based safe-button route readiness check.
- `scripts/cleanup-project-processes.mjs` detects safe-button smoke and manual QA helper process trees, with regression coverage in `scripts/cleanup-project-processes.test.mjs`.
- `src/hooks/useSkillEditorTabs.ts` focuses the selected editor tab immediately and keeps the request-animation-frame focus fallback.
- `docs/v1-release/manual-external-qa.md` clarifies that `blocked` readiness can be an expected sanitized snapshot when provider credentials are intentionally incomplete.
- `docs/v1-release/latest-local-qa-evidence.md` records the current verification state and remaining manual gates.

Nested verification:

```powershell
cd rag-interface
npx --yes tsx src/lib/ui/editor-tab-navigation.test.ts
npx --yes tsx src/lib/settings/client-api.test.ts
npx --yes tsx scripts/cleanup-project-processes.test.mjs
npx --yes tsx scripts/smoke/smoke-buttons-static.test.mjs
npx --yes tsx scripts/smoke/smoke-local-static.test.mjs
npm run cleanup:project:dry-run
npm run smoke:buttons
npm run smoke:local
npm run verify:release
```

Latest verified result:

- `npm run verify:release` passed through `.\scripts\verify-workspace.ps1 -FullRelease`.
- Cleanup dry-run and focused cleanup tests passed after expanding process coverage.
- Safe button smoke passed after the route text wait fix.
- Local smoke passed after the restore-button, route-readiness, manual-QA, file-import, and editor-focus fixes.

## Manual Gates

These remain manual or account-backed by design:

1. Native OS folder picker visibility.
2. Visible Claude login launch.
3. Real account-backed chat/auth.

Use `rag-interface/docs/v1-release/manual-external-qa.md` and the Settings Manual QA Evidence panel to record those checks.

## Commit Notes

No commit or push has been made.

Recommended commit split when explicitly approved:

1. Parent workspace hardening and handoff docs.
2. Nested V1 app smoke/readiness stabilization.

Do not pull or merge parent remote branches in the dirty tree without first deciding whether this checkout should remain a parent wrapper with nested `rag-interface/` or move to the app-root `origin/main` layout. The local parent skill still writes PR bodies to `docs/pr-description.md`; keep that behavior if the wrapper layout is preserved.
