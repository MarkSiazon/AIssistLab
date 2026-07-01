# Latest Local QA Evidence

Updated: 2026-07-01, Asia/Manila

This note records the latest local, privacy-safe verification state for the V1 release candidate. It is intentionally generic: no API keys, account identifiers, OAuth paths, full home paths, or raw Claude profile folders are included.

## Current Checkpoint

- Branch: `dev`
- Latest pushed automated checkpoint: commit `1341938` on `dev` added the V1 release-package evidence workflow, Settings and Chat privacy hardening, expanded smoke coverage, and refreshed V1 release docs.
- Current automated result: `npm run release:prepare` passed from clean `dev...origin/dev` at commit `1341938`. The finite package pass ran cleanup dry-runs, `npm run verify:release` once, and sanitized release evidence output. The gate covered 163 test files, lint, production build, production smoke, dependency audit, local browser/API smoke, safe button smoke, manual QA helper auto smoke, project cleanup dry-runs, artifact cleanup dry-run, asset/docs/dead-code/unused-export audits, diff whitespace, untracked release-text hygiene, and privacy scan.
- Manual status: the automated gate is green, but V1 is not fully manually certified until the native folder picker, visible Open Login flow, and real account-backed chat/auth checks are completed by the local user.
- GitHub status: issue #3 remains open as the manual QA tracker and has been updated with the latest automated status for commit `1341938`.
- Release QA checkpoint: cleanup and audit stabilization is recorded on the release branch history; use the push-state line below for the current commit/sync state.
- Included release QA work: smoke-runner coverage fixes in `scripts/smoke-local.mjs`, matching static regression coverage in `scripts/smoke/smoke-local-static.test.mjs`, retryable safe-button route readiness stabilization in `scripts/smoke-buttons.mjs`, matching static regression coverage in `scripts/smoke/smoke-buttons-static.test.mjs`, bounded retryable export download waits, explicit Claude refresh coverage after Settings reloads, deterministic settings save-failure coverage in `src/lib/settings/client-api.test.ts`, release cleanup coverage for safe-button and manual-QA helper runs in `scripts/cleanup-project-processes.mjs`, editor tab focus stabilization in `src/hooks/useSkillEditorTabs.ts`, and manual QA helper clarification in `docs/v1-release/release-candidate-runbook.md#manual-external-qa`.
- Local artifact cleanup is now documented and covered by `scripts/cleanup-local-artifacts.mjs`; it removes only ignored `.next`, `.local-workspace`, `out`, `build`, `coverage`, `tsconfig.tsbuildinfo`, and `next-env.d.ts` outputs after dry-run inspection.
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
- RAG index and release readiness status types now resolve through their canonical domain modules instead of repeating matching string unions across UI, settings, chat, export, and skill readiness helpers.
- LLM provider and runtime-source types now resolve through the canonical LLM type module instead of repeating provider/source unions across chat readiness, runtime settings, Setup Doctor, settings client, and UI helper models.
- Settings client and UI Claude profile/status helpers now alias the canonical Claude discovery and CLI status types instead of restating profile, auth, and smoke-test response shapes.
- Settings client, first-run, chat readiness, and Claude settings UI helpers now reuse canonical runtime-status and Claude CLI test-result shapes instead of maintaining partial local copies.
- Generic UI tone types now resolve through `src/lib/ui/tone.ts` instead of repeating status-tone unions across Settings, Chat readiness, and Skills import presentation helpers.
- Skills import preview actions now reuse the canonical import source type from the import panel model instead of maintaining a duplicate folder/archive/GitHub source union.
- Skills import apply actions now reuse the canonical import duplicate-strategy type instead of maintaining a duplicate skip/overwrite/rename union.
- Skills import UI preview shapes now alias the canonical importer domain preview/source/strategy types, and the skills client no longer imports preview response types from the UI model.
- Skills restore/list UI and client response shapes now alias the canonical deleted-skill trash summary instead of restating partial deleted-skill metadata.
- Skill editor UI and save-client validation error shapes now reuse the canonical skills validation error type instead of restating editor-local validation fields.
- Chat readiness client and UI response shapes now alias chat-owned status types instead of requiring the chat client to import presentation helper types.
- Shared ok/warn/error status severity types now live in a domain-neutral status module, with UI tone, guided feedback, first-run doctor, and Claude project types aliasing that source instead of restating the same status unions.
- Repeated readiness status unions now resolve through shared optional/blocking readiness aliases while preserving release, skills, settings, first-run, and guided checklist public type names.
- Repeated status color, label, and tone mappings now use shared status presentation helpers while preserving existing Settings, Guided Builder, and Skills readiness public helper APIs.
- Shared status presentation mappings now have direct unit coverage in addition to the existing consumer helper tests.
- Shared app route constants now back repeated model-layer Settings, Chat, Export, Skills, and Guided Builder action links while preserving existing public action helper outputs.
- Rendered app links, primary navigation, root redirect, route-changing hooks, Settings readiness action context, and route announcements now use the same shared app route constants instead of repeating first-party route literals in components.
- Client-side API endpoints now resolve through shared API route constants and encoded route builders for chat, settings, skills, export, guided-builder, editor, path picker, and index workflows instead of repeating `/api/...` literals across UI clients.
- App route constants now have manifest coverage against the static navigable `src/app/**/page.tsx` tree, with dynamic editor pages explicitly covered by encoded route builders.
- API route constants now have manifest coverage against the static `src/app/api/**/route.ts` tree, with dynamic skill routes explicitly covered by encoded route builders.
- Static route-literal ownership coverage now prevents first-party app and API route strings from drifting back into non-route source modules.
- Static route and navigation safety tests now share route-expression recognition through a test utility instead of rebuilding matching logic per test.
- Static source test helpers now include shared multi-root, multi-extension collection plus Next app-router route-file collection and normalization so route ownership, route manifests, and navigation safety scans use the same deterministic file discovery.
- Manual external QA instructions were consolidated into the release-candidate runbook so the device/account checklist has one maintained source of truth.
- Count/plural label formatting is centralized in `src/lib/format/count-label.ts`, replacing duplicate local helpers across release readiness, guided checklist, setup doctor, skill editor save states, skill quality summaries, skills import, and skills readiness models.
- Settings client API requests now use the shared API client directly; the redundant settings-only request wrapper was removed while preserving injected fetchers for tests.
- Skill library readiness now consumes the canonical Skill Quality report shape and shared severity counters instead of maintaining duplicate quality report/counting logic.
- Skill import previews now use the canonical Skill Quality warning filter and shared count-label formatting for preview issue summaries.
- Skills page and import preview copy now use the public `countLabel` helper directly; the lower-level plural helper is private to the formatter module.
- Skill lifecycle and guided-builder API routes now share canonical JSON failure helpers for `{ ok: false }` error and validation responses.
- Settings path existence checks now share one expanded-path state helper between the API route and Setup Doctor.
- Local and production smoke runners now share app-route and chat-readiness link coverage definitions through the smoke DOM coverage helper.
- Smoke and manual QA scripts now share local server helpers for free-port allocation, bounded process logs, and fetch timeouts.
- Remaining hand-rolled singular/plural status strings now use the shared `countLabel` formatter across Setup Doctor, First Run Checklist, Claude project inventory, index summaries, chat, skill editor, and import preview UI.
- Manual QA status classes and guided-builder handoff action classes are now model-owned helpers instead of component-local presentation logic.
- Export readiness now uses the canonical release-status label and color helpers directly instead of maintaining pass-through readiness wrappers.
- Settings RAG index panels now use canonical index-status label and color helpers directly instead of maintaining settings pass-through wrappers.
- Sidebar, Settings, Skills, and Chat index messages now share canonical index-status copy and count formatting helpers.
- README verification guidance now points to the release-candidate runbook for detailed command, focused debugging, cleanup, and manual QA coverage instead of duplicating the maintained runbook text.
- README documentation links now avoid repeating the manual external QA anchor already called out in the Verification section.
- README Local API guidance now points to the maintained API route constants and handler tree instead of duplicating a partial endpoint list.
- V1 current feature inventory API lists now include the current Claude project, skill restore, template, and import endpoints present in the route handler tree, with route-derived test coverage to catch future drift.
- Smoke runners now share the server-readiness polling helper while preserving runner-specific probe paths and error labels.
- Local and production smoke runners now share browser issue tracking while preserving expected-issue and production-guard filtering behavior.
- Local and production chat smokes now share mock chat stream construction while preserving runner-specific preview, text, and error payloads.
- Local and production chat smokes now share the chat status fixture while preserving runner-specific suggested questions and stale-index prompts.
- Local and production Settings smokes now share the Claude CLI status fixture builder while preserving provider, version, and selected-profile differences.
- Local and production route smokes now share the index-status fixture builder for ready, missing, and stale index scenarios.
- Local and production Settings smokes now share settings-env and runtime-status fixture builders while preserving route-specific response fields.
- Production Settings smokes now share the Setup Doctor success fixture instead of carrying a full doctor report payload inline in the runner.
- Local and production Skills smokes now share skill-quality, skills-list, and export-skills fixture builders for repeated no-issue and export payloads.
- Local skills import smokes now share import-preview skill, import-preview envelope, and import-apply result builders for failure and duplicate scenarios.
- Production editor smokes now use the shared skill-template fixture payload instead of carrying an inline template list in the runner.
- Local and production smoke runners now share release readiness fixture builders while keeping scenario-specific sections, scores, and actions in each runner.
- Local and production smoke runners now share JSON, event-stream, and attachment route fulfillment for repeated mocked API responses while preserving runner-specific status codes, filenames, and payloads.
- Local and production chat smokes now share mock clipboard installation and copied-text reads through the smoke browser-init helper.
- Strict unused-export auditing now runs through `npm run audit:exports` and is part of the release gate instead of an ad hoc Knip command.
- The V1 spec index now points at the release-candidate runbook for maintained command gates instead of carrying a duplicate acceptance-gate command list.
- Local artifact cleanup now includes ignored `out`, `build`, `coverage`, and `next-env.d.ts` outputs in the same safe repo-root allowlist used for `.next` and smoke workspaces.
- The release gate now reports local artifact cleanup dry-run state after smoke/manual-helper checks so generated outputs are visible before final cleanup.
- The privacy/security checklist release-verifier summary now matches the current gate coverage for cleanup dry-runs and asset/docs/dead-code/unused-export audits.
- Push state: use `git status --short --branch` as the source of truth for whether this evidence snapshot has been committed and pushed.

## Automated Verification

The latest full release gate passed:

```bash
npm run verify:release
```

That run covered 163 test files and still reported manual external QA as required for native OS picker visibility, visible Open Login, and real account-backed chat.

An earlier nested full release gate also passed through the parent workspace verifier:

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
- safe button smoke
- manual QA helper auto smoke
- project cleanup dry-run postflight
- local artifact cleanup dry-run postflight
- asset usage audit
- documentation link audit
- dead-code audit
- unused-export audit
- diff whitespace check
- untracked text hygiene scan
- privacy scan

Latest focused checks for the current cleanup and smoke-helper pass:

```bash
npm run smoke:buttons
npm run smoke:local
npm run build
npm run smoke:production
npm run qa:manual:auto
npx --yes tsx src/lib/routes/api-inventory-docs.test.ts
npx --yes tsx src/lib/routes/api-routes.test.ts
npx --yes tsx src/lib/routes/app-routes.test.ts
npx --yes tsx src/lib/routes/route-literal-ownership.test.ts
npx --yes tsx src/lib/test-utils/static-source.test.ts
npx --yes tsx scripts/cleanup-local-artifacts.test.mjs
npx --yes tsx scripts/smoke/smoke-local-static.test.mjs
npx --yes tsx scripts/smoke/browser-init.test.mjs
npx --yes tsx scripts/smoke/browser-issues.test.mjs
npx --yes tsx scripts/smoke/chat-mocks.test.mjs
npx --yes tsx scripts/smoke/claude-mocks.test.mjs
npx --yes tsx scripts/smoke/index-mocks.test.mjs
npx --yes tsx scripts/smoke/settings-mocks.test.mjs
npx --yes tsx scripts/smoke/skills-mocks.test.mjs
npx --yes tsx scripts/smoke/release-mocks.test.mjs
npx --yes tsx scripts/smoke/route-fulfill.test.mjs
npm run audit:assets
npm run audit:docs
npm run audit:dead-code
npm run audit:exports
npm run cleanup:artifacts:dry-run
npm run cleanup:project:dry-run
git diff --check
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

## Dev V1 Polish Evidence

Latest `dev` polish added an explicit `Skipped` Manual QA Evidence state for checks intentionally not verified and fixed inactive editor tab panels so Preview hides the edit textarea instead of leaving both panels visible. `Skipped` is tracked separately from `Passed`, does not make the summary complete, and is covered by local helper tests plus local and production smoke interactions.

The current release-package pass refreshed release docs, added the V1 ship checklist, expanded production smoke guard coverage for mutating skill/guided endpoints, added built-production path-picker and Manual QA Evidence persistence coverage, added `/editor` to the safe-button smoke, redacted Settings API secret-like env responses with placeholder-preserving saves, sanitized chat stream error output, expanded privacy scans to catch account identifiers and generic API-key-shaped values, added sanitized release evidence output, added a finite `release:prepare` wrapper, and tightened readiness recovery action copy.

The final `npm run release:prepare` pass from commit `1341938` passed. The run covered all 163 test files, lint, production build, production smoke, dependency audit, local browser/API smoke, safe button smoke, manual QA helper auto smoke, project cleanup dry-runs, artifact cleanup dry-run, asset/docs/dead-code/unused-export audits, diff whitespace, untracked release-text hygiene, privacy scan, and sanitized release evidence output.

## Manual Gates Still Required

These remain manual or account-backed by design:

1. Native OS folder picker visibility.
2. Visible Claude login launch.
3. Real account-backed chat/auth.

Latest `npm run qa:manual:auto` refreshed sanitized local status and confirmed the helper still leaves those three checks as manual-only. It reported release readiness and chat readiness blocked by local configuration, runtime provider `anthropic_api`, and discovered Claude profiles without exposing account identifiers, raw auth paths, or secrets.

Use the [release-candidate runbook manual QA section](release-candidate-runbook.md#manual-external-qa) for the device/account checks.
