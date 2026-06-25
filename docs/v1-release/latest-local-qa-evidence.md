# Latest Local QA Evidence

Updated: 2026-06-25, Asia/Manila

This note records the latest local, privacy-safe verification state for the V1 release candidate. It is intentionally generic: no API keys, account identifiers, OAuth paths, full home paths, or raw Claude profile folders are included.

## Current Checkpoint

- Branch: `main`
- Base commit: `9484f0a` (`origin/main`, `fix(release): harden local QA and Claude login`)
- Local working tree: uncommitted smoke-runner coverage fixes in `scripts/smoke-local.mjs`, matching static regression coverage in `scripts/smoke/smoke-local-static.test.mjs`, safe-button route readiness stabilization in `scripts/smoke-buttons.mjs`, matching static regression coverage in `scripts/smoke/smoke-buttons-static.test.mjs`, deterministic settings save-failure coverage in `src/lib/settings/client-api.test.ts`, release cleanup coverage for safe-button and manual-QA helper runs in `scripts/cleanup-project-processes.mjs`, editor tab focus stabilization in `src/hooks/useSkillEditorTabs.ts`, manual QA helper clarification in `docs/v1-release/manual-external-qa.md`, and this evidence refresh.
- Push state: no commit or push attempted in this checkpoint.

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
- diff whitespace check
- untracked text hygiene scan
- privacy scan

Additional focused checks also passed:

```bash
npx --yes tsx src/lib/ui/editor-tab-navigation.test.ts
npx --yes tsx src/lib/settings/client-api.test.ts
npx --yes tsx scripts/cleanup-project-processes.test.mjs
npx --yes tsx scripts/smoke/smoke-buttons-static.test.mjs
npx --yes tsx scripts/smoke/smoke-local-static.test.mjs
npm run cleanup:project:dry-run
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

## Manual Gates Still Required

These remain manual or account-backed by design:

1. Native OS folder picker visibility.
2. Visible Claude login launch.
3. Real account-backed chat/auth.

Use [manual-external-qa.md](manual-external-qa.md) for the device/account checks.
