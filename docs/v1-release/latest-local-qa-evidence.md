# Latest Local QA Evidence

Updated: 2026-06-25, Asia/Manila

This note records the latest local, privacy-safe verification state for the V1 release candidate. It is intentionally generic: no API keys, account identifiers, OAuth paths, full home paths, or raw Claude profile folders are included.

## Current Checkpoint

- Branch: `main`
- Release QA checkpoint: previous stabilization committed and pushed on `origin/main`; current cleanup and audit edits are local until committed.
- Included release QA work: smoke-runner coverage fixes in `scripts/smoke-local.mjs`, matching static regression coverage in `scripts/smoke/smoke-local-static.test.mjs`, retryable safe-button route readiness stabilization in `scripts/smoke-buttons.mjs`, matching static regression coverage in `scripts/smoke/smoke-buttons-static.test.mjs`, bounded retryable export download waits, explicit Claude refresh coverage after Settings reloads, deterministic settings save-failure coverage in `src/lib/settings/client-api.test.ts`, release cleanup coverage for safe-button and manual-QA helper runs in `scripts/cleanup-project-processes.mjs`, editor tab focus stabilization in `src/hooks/useSkillEditorTabs.ts`, and manual QA helper clarification in `docs/v1-release/manual-external-qa.md`.
- Local artifact cleanup is now documented and covered by `scripts/cleanup-local-artifacts.mjs`; it removes only ignored `.next`, `.local-workspace`, and `tsconfig.tsbuildinfo` outputs after dry-run inspection.
- Asset usage auditing is now part of the release gate; the unused starter Geist font files were removed after the audit identified them as unreferenced tracked assets.
- Dependency cleanup removed unused class-name helper packages and the redundant external `natural` type package; `natural` now uses its bundled type declarations.
- The release runbook now points at `npm test` as the authoritative test sweep instead of keeping a partial duplicate manual loop.
- Skill body size limits are now centralized in `src/lib/skills/limits.ts` so client editor validation and server/import validation use the same value, and unused guided-draft storage-key re-exports were removed.
- Documentation link auditing is now part of the release gate so README and docs markdown cannot drift to missing local files or headings.
- Push state: use `git status --short --branch` as the source of truth for whether this evidence snapshot has been committed and pushed.

## Automated Verification

The latest full release gate passed:

```bash
npm run verify:release
```

The same nested full release gate also passed through the parent workspace verifier:

```powershell
.\scripts\verify-workspace.ps1 -FullRelease
```

Covered by that gate:

- project cleanup dry-run preflight
- full test sweep
- lint
- production build
- production server smoke
- dependency audit
- local browser/API smoke
- manual QA helper auto smoke
- project cleanup dry-run postflight
- asset usage audit
- documentation link audit
- diff whitespace check
- untracked text hygiene scan
- privacy scan

Additional focused checks also passed:

```bash
npx --yes tsx src/lib/ui/editor-tab-navigation.test.ts
npx --yes tsx src/lib/ui/skill-editor-model.test.ts
npx --yes tsx src/lib/settings/client-api.test.ts
npx --yes tsx src/lib/skills/validation.test.ts
npx --yes tsx scripts/audit-docs.test.mjs
npx --yes tsx scripts/audit-assets.test.mjs
npx --yes tsx scripts/cleanup-local-artifacts.test.mjs
npx --yes tsx scripts/cleanup-project-processes.test.mjs
npx --yes tsx scripts/smoke/smoke-buttons-static.test.mjs
npx --yes tsx scripts/smoke/smoke-local-static.test.mjs
npm run audit:assets
npm run audit:docs
npm run cleanup:artifacts:dry-run
npm run cleanup:project:dry-run
npm audit --audit-level=moderate
npm run lint
npm run smoke:buttons
npm run smoke:local
```

Before the passing run, Playwright Chromium revision `1228` was installed into the machine-level Playwright cache because the existing cache only had revision `1223` and this repo uses Playwright `1.61.0`.

## Diagnostics Privacy Evidence

The diagnostics ZIP route test now rejects these unsafe patterns in diagnostics output:

- raw Windows or Unix-style home paths
- OAuth/auth path terms
- authorization headers
- bearer-token shaped strings
- `sk-` token shaped strings
- raw Claude profile directory paths

The full release privacy scan also passed with no private local paths, account identifiers, API keys, auth paths, or bearer tokens found.

## Claude Profile API Privacy Evidence

The Claude CLI profiles route now maps an explicit public response shape before serialization. The route test verifies that profile API output omits internal config fields, raw profile directory names, account emails, token-shaped values, and full local paths while preserving generic labels such as `Profile 1` and `~\.claude-profiles\<hidden>`.

## Process Hygiene

The latest cleanup dry-run found no repo-owned stale Next, smoke, test, release, or manual QA helper processes:

```bash
npm run cleanup:project:dry-run
```

A final scoped process scan found no leftover project servers.

Ignored local build and smoke artifacts can be removed after verification with:

```bash
npm run cleanup:artifacts:dry-run
npm run cleanup:artifacts
```

## Manual Gates Still Required

These remain manual or account-backed by design:

1. Native OS folder picker visibility.
2. Visible Claude login launch.
3. Real account-backed chat/auth.

Use [manual-external-qa.md](manual-external-qa.md) for the device/account checks.
