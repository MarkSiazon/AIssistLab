# Latest Local QA Evidence

Updated: 2026-08-10, Asia/Manila

This note records only the current privacy-safe V1 release-candidate verification state. Historical details live in [qa-history.md](qa-history.md), repeatable commands live in [release-candidate-runbook.md](release-candidate-runbook.md), and public-facing release changes live in [release-notes.md](release-notes.md).

## Current Checkpoint

- Branch: `agent/dependency-security` (local checkpoint based on `dev`)
- Latest pushed automated checkpoint: commit `668e8bf` on `dev` bundled ripgrep via the `@vscode/ripgrep` devDependency so the privacy scan runs without a system install, and scoped the deleted-skill trash to its originating workspace (an opaque per-workspace fingerprint) so a deletion in one workspace can no longer be restored into another. These followed the earlier export zip unknown-skill 404 fix and the sidebar index-status revalidation fix.
- Current local automated result: `npm run verify:release` passed on 2026-08-10 after the dependency-security repair. The gate covered 170 test files, lint, the Next.js 16.3 production build, production smoke, a zero-vulnerability dependency audit, local browser/API smoke, safe button smoke, manual QA helper auto smoke, cleanup dry-runs, asset/docs/dead-code/unused-export audits, diff whitespace, untracked release-text hygiene, and privacy scan.
- Dependency result: direct security updates moved Next.js and `eslint-config-next` to 16.3.0, `js-yaml` to 4.3.1, and PostCSS to 8.5.26; the refreshed lockfile also resolved the affected transitive dependency paths. `npm audit` reports zero vulnerabilities.
- Build compatibility note: Next.js now type-checks the production application through `tsconfig.build.json`, which excludes test-only TypeScript fixtures while leaving the full 170-file test sweep as the first release-gate stage.
- Environment note: the privacy scan uses the ripgrep binary bundled by `@vscode/ripgrep` (installed with `npm install`) and falls back to a PATH-resolved `rg` only when the bundle is unavailable.
- Current GitHub status: the manual QA tracker issue #3 was closed on 2026-07-07 after all three device/account gates were verified; the `v1.0.0` draft release was created from `main`.
- Current manual status: the existing all-green record for the three manual gates remains documented from 2026-07-07. Those device/account-backed checks were not rerun during the 2026-08-10 dependency-only checkpoint.

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

- 170 test files
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
