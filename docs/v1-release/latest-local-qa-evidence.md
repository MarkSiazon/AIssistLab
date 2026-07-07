# Latest Local QA Evidence

Updated: 2026-07-07, Asia/Manila

This note records only the current privacy-safe V1 release-candidate verification state. Historical details live in [qa-history.md](qa-history.md), repeatable commands live in [release-candidate-runbook.md](release-candidate-runbook.md), and public-facing release changes live in [release-notes.md](release-notes.md).

## Current Checkpoint

- Branch: `dev`
- Latest pushed automated checkpoint: commit `fb3256f` on `dev` fixed the export zip unknown-skill response (404 instead of an empty archive) and made the sidebar index status revalidate after skill saves, imports, deletes, and restores through a shared client cache, with a new local smoke assertion covering the no-reload sidebar update.
- Current automated result: `npm run verify:release` passed on 2026-07-07 at commit `fb3256f` with a clean working tree before the evidence-note refresh. The gate covered 169 test files, lint, production build, production smoke, dependency audit, local browser/API smoke, safe button smoke, manual QA helper auto smoke, cleanup dry-runs, asset/docs/dead-code/unused-export audits, diff whitespace, untracked release-text hygiene, and privacy scan.
- Environment note: the privacy scan step requires the `rg` (ripgrep) executable on PATH; the gate fails with a spawn error on machines without it.
- Current GitHub status: issue #3 remains the manual QA tracker. This local automated pass did not update GitHub.
- Current manual status: V1 is not fully manually certified until the native folder picker, visible Open Login flow, and real account-backed chat/auth checks are completed by the local user.

## Latest Commands

```bash
npm run verify:release
npm run cleanup:artifacts
npm run release:evidence -- --gate-result passed
npm run cleanup:project:dry-run
npm run cleanup:artifacts:dry-run
```

Latest local cleanup dry-runs found no repo-owned stale processes and no local build or smoke artifacts after final cleanup.

## Automated Gate Coverage

- 169 test files
- lint
- production build
- production server smoke
- dependency audit
- local browser/API smoke
- safe button smoke
- manual QA helper auto smoke
- project cleanup dry-run preflight and postflight
- local artifact cleanup dry-run postflight
- asset usage audit
- documentation link audit
- dead-code audit
- unused-export audit
- diff whitespace check
- untracked release-text hygiene scan
- privacy scan

## Manual Gates Still Required

These remain manual or account-backed by design:

1. Native OS folder picker visibility.
2. Visible Claude login launch.
3. Real account-backed chat/auth.

Use the [release-candidate runbook manual QA section](release-candidate-runbook.md#manual-external-qa) for the device/account checks.
