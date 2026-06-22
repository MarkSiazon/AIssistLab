# Latest Local QA Evidence

Updated: 2026-06-23, Asia/Manila

This note records the latest local, privacy-safe verification state for the V1 release candidate. It is intentionally generic: no API keys, account identifiers, OAuth paths, full home paths, or raw Claude profile folders are included.

## Current Checkpoint

- Branch: `main`
- Local checkpoint subject: `chore(qa): harden local release checks`
- Remote state: local branch is ahead of `origin/main` by one commit.
- Push state: blocked by GitHub credentials lacking write permission for the remote repository.

## Automated Verification

The latest full release gate passed:

```bash
npm run verify:release
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
npx --yes tsx src/app/api/export/zip/route.test.ts
npx --yes tsx src/app/api/settings/claude-cli/profiles/route.test.ts
npm run smoke:local
```

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

The latest cleanup dry-run found no repo-owned stale Next, smoke, test, or manual QA helper processes:

```bash
npm run cleanup:project:dry-run
```

A final scoped process scan found no leftover project servers.

## Manual Gates Still Required

These remain manual or account-backed by design:

1. Native OS folder picker visibility.
2. Visible Claude login launch.
3. Real account-backed chat/auth.
4. GitHub push after authenticating with a writer account for the remote repository.

Use [manual-external-qa.md](manual-external-qa.md) for the device/account checks.
