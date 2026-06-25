# Latest Local QA Evidence

Updated: 2026-06-25, Asia/Manila

This note records the latest local, privacy-safe verification state for the V1 release candidate. It is intentionally generic: no API keys, account identifiers, OAuth paths, full home paths, or raw Claude profile folders are included.

## Current Checkpoint

- Branch: `main`
- Release QA checkpoint: cleanup and audit stabilization is recorded on `main`; use the push-state line below for the current commit/sync state.
- Included release QA work: smoke-runner coverage fixes in `scripts/smoke-local.mjs`, matching static regression coverage in `scripts/smoke/smoke-local-static.test.mjs`, retryable safe-button route readiness stabilization in `scripts/smoke-buttons.mjs`, matching static regression coverage in `scripts/smoke/smoke-buttons-static.test.mjs`, bounded retryable export download waits, explicit Claude refresh coverage after Settings reloads, deterministic settings save-failure coverage in `src/lib/settings/client-api.test.ts`, release cleanup coverage for safe-button and manual-QA helper runs in `scripts/cleanup-project-processes.mjs`, editor tab focus stabilization in `src/hooks/useSkillEditorTabs.ts`, and manual QA helper clarification in `docs/v1-release/release-candidate-runbook.md#manual-external-qa`.
- Local artifact cleanup is now documented and covered by `scripts/cleanup-local-artifacts.mjs`; it removes only ignored `.next`, `.local-workspace`, and `tsconfig.tsbuildinfo` outputs after dry-run inspection.
- Asset usage auditing is now part of the release gate; the unused starter Geist font files were removed after the audit identified them as unreferenced tracked assets.
- Dependency cleanup removed unused class-name helper packages and the redundant external `natural` type package; `natural` now uses its bundled type declarations.
- Dead-code auditing is now part of the release gate through repo-specific Knip entry points for Next routes, scripts, and tests.
- The release runbook now points at `npm test` as the authoritative test sweep instead of keeping a partial duplicate manual loop.
- Skill body size limits are now centralized in `src/lib/skills/limits.ts` so client editor validation and server/import validation use the same value, and unused guided-draft storage-key re-exports were removed.
- Documentation link auditing is now part of the release gate so README and docs markdown cannot drift to missing local files or headings.
- Release audit scripts now share repo file discovery through `scripts/lib/repo-files.mjs`, reducing duplicate git/path handling between asset and docs audits.
- Setup Doctor text sanitization and severity mapping helpers are now private to `doctor-model.ts`, reducing exported API surface without changing report behavior.
- Release and QA helper script internals now keep git spawning, markdown line mapping, and manual-check definitions private to their modules.
- Claude discovery path home resolution, RAG index chunking, and import-name normalization helpers are now private to their owning modules.
- Local-access block-reason helpers, Claude profile response shaping, CLI test-state reads, and release text sanitization are now private implementation details.
- Chat readiness label and tone helpers are now private behind the exported panel model builders.
- Manual QA helper internals, guided autosave versioning constants, and manual QA storage keys are now private, and unused skill import/unlink helpers were removed.
- Test request origin and non-local host constants are now private behind the request helper builders.
- Chat stream line parsing is now private behind the public streaming client, with parser behavior covered through stream-level tests.
- Settings path privacy sanitization is now private behind the public settings path formatter.
- Claude discovery regex escaping, selected-profile helpers, and native-install path lookup are no longer exposed through public discovery module surfaces.
- Claude CLI path, config-dir, and login-command readers are no longer re-exported through the legacy LLM config barrel.
- Native folder picker process launching, guided-draft normalization, unused skill writer delete wrapper, and editor body-size limit re-export were removed from public runtime surfaces.
- Component import panel aliases, guided summary metric types, API error payload helpers, cache get-options, Claude discovery barrel aliases, first-run internal states, runtime-provider aliases, and path-browser entry/search shapes were narrowed from unused exported type surfaces.
- Strict exported-type cleanup now reports zero unused exported type findings; helper UI shapes, release/settings aliases, guided-builder/import barrels, test workspace options, and stale skill summary types are private or removed where they have no external consumers.
- Manual external QA instructions were consolidated into the release-candidate runbook so the device/account checklist has one maintained source of truth.
- Count/plural label formatting is centralized in `src/lib/format/count-label.ts`, replacing duplicate local helpers across release readiness, guided checklist, setup doctor, skill editor save states, skill quality summaries, skills import, and skills readiness models.
- Settings client API requests now use the shared API client directly; the redundant settings-only request wrapper was removed while preserving injected fetchers for tests.
- Skill library readiness now consumes the canonical Skill Quality report shape and shared severity counters instead of maintaining duplicate quality report/counting logic.
- Skill import previews now use the canonical Skill Quality warning filter and shared count-label formatting for preview issue summaries.
- Skills page and import preview copy now use the public `countLabel` helper directly; the lower-level plural helper is private to the formatter module.
- Skill lifecycle and guided-builder API routes now share canonical JSON failure helpers for `{ ok: false }` error and validation responses.
- Settings path existence checks now share one expanded-path state helper between the API route and Setup Doctor.
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
- dead-code audit
- diff whitespace check
- untracked text hygiene scan
- privacy scan

Additional focused checks also passed:

```bash
npx --yes tsx src/lib/ui/editor-tab-navigation.test.ts
npx --yes tsx src/lib/ui/skill-editor-model.test.ts
npx --yes tsx src/lib/settings/client-api.test.ts
npx --yes tsx src/lib/settings/doctor.test.ts
npx --yes tsx src/lib/skills/validation.test.ts
npx --yes tsx src/lib/claude/discovery.test.ts
npx --yes tsx src/lib/rag/claude-cli-runtime.test.ts
npx --yes tsx src/app/api/settings/native-folder/route.test.ts
npx --yes tsx src/lib/skills/guided-builder.test.ts
npx --yes tsx src/lib/ui/skill-editor-model.test.ts
npx --yes tsx src/lib/api/client.test.ts
npx --yes tsx src/lib/settings/client-api.test.ts
npx --yes tsx src/lib/async-ttl-cache.test.ts
npx --yes tsx src/lib/settings/first-run-checklist.test.ts
npx --yes tsx src/lib/settings/path-browser.test.ts
npx --yes tsx src/lib/settings/runtime-config.test.ts
npx --yes tsx src/lib/format/count-label.test.ts
npx --yes tsx src/lib/release/readiness.test.ts
npx --yes tsx src/lib/release/readiness-report.test.ts
npx --yes tsx src/lib/ui/chat-empty-state.test.ts
npx --yes tsx src/lib/ui/export-empty-state.test.ts
npx --yes tsx src/lib/ui/guided-checklist.test.ts
npx --yes tsx src/lib/ui/guided-handoff.test.ts
npx --yes tsx src/lib/ui/setup-doctor-panel.test.ts
npx --yes tsx src/lib/ui/settings-claude-panel.test.ts
npx --yes tsx src/lib/ui/settings-claude-profile-field.test.ts
npx --yes tsx src/lib/ui/settings-config-fields-panel.test.ts
npx --yes tsx src/lib/ui/settings-release-readiness-panel.test.ts
npx --yes tsx src/lib/ui/skills-import-action.test.ts
npx --yes tsx src/lib/ui/skills-import-preview-action.test.ts
npx --yes tsx src/lib/ui/skills-import-preview-row.test.ts
npx --yes tsx src/lib/ui/skills-import-preview-summary.test.ts
npx --yes tsx src/lib/ui/skills-library-readiness-panel.test.ts
npx --yes tsx src/lib/ui/skills-page-model.test.ts
npx --yes tsx src/lib/skills/importer.test.ts
npx --yes tsx src/lib/local-access.test.ts
npx --yes tsx src/app/api/settings/local-guards.test.ts
npx --yes tsx src/app/api/settings/claude-cli/profiles/route.test.ts
npx --yes tsx src/lib/rag/claude-cli-test-state.test.ts
npx --yes tsx src/lib/release/readiness-report.test.ts
npx --yes tsx src/lib/ui/chat-readiness-panel.test.ts
npx --yes tsx src/lib/skills/guided-autosave.test.ts
npx --yes tsx src/lib/skills/importer.test.ts
npx --yes tsx src/lib/ui/manual-external-qa-panel.test.ts
npx --yes tsx src/lib/test-utils/request.test.ts
npx --yes tsx src/lib/chat/client-api.test.ts
npx --yes tsx src/lib/ui/settings-path-display.test.ts
npx --yes tsx scripts/lib/repo-files.test.mjs
npx --yes tsx scripts/audit-docs.test.mjs
npx --yes tsx scripts/audit-dead-code.test.mjs
npx --yes tsx scripts/manual-external-qa.test.mjs
npx --yes tsx scripts/audit-assets.test.mjs
npx --yes tsx scripts/cleanup-local-artifacts.test.mjs
npx --yes tsx scripts/cleanup-project-processes.test.mjs
npx --yes tsx scripts/smoke/smoke-buttons-static.test.mjs
npx --yes tsx scripts/smoke/smoke-local-static.test.mjs
npm run audit:assets
npm run audit:docs
npm run audit:dead-code
npx knip --exports --include-entry-exports --no-progress --max-show-issues 80
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

Use the [release-candidate runbook manual QA section](release-candidate-runbook.md#manual-external-qa) for the device/account checks.
