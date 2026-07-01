# V1 Ship Checklist

Use this checklist to keep the final V1 release pass scoped to the Claude-first local app. It separates Codex-controlled gates from device/account checks that must stay manual.

## Scope Boundary

V1 includes the current Skill Workshop RAG app: Settings, Skills, Editor, Guided Builder, Chat, Export, Setup Doctor, V1 Release Readiness, sanitized diagnostics, and Manual QA Evidence.

V1 does not include the V2 provider registry, new AI provider adapters, hosted local-CLI auth, automatic login, automatic generation, broad device scans, or automatic changes to Claude Code configuration.

## Batch 1: Release State Sync

- Latest local QA evidence reflects the current branch, merged hardening PR, commit, test count, and manual-gate status.
- Release notes describe the latest automated hardening checkpoint.
- Docs index and README link to this checklist.
- GitHub issue #3 remains the manual QA tracker.

Evidence:

```bash
npm run audit:docs
git diff --check
```

## Batch 2: Automated QA Coverage Sweep

- Local and production smokes cover Settings, Skills, Editor, Guided Builder, Chat, Export, and Manual QA Evidence.
- Static smoke tests protect critical smoke assertions from drifting.
- UI assertions cover blocked states, disabled/loading states, status text, and non-overlapping tab/panel behavior where automation can prove it.
- Manual-only behavior is not faked: native OS picker visibility, visible Open Login, and real account-backed chat stay documented as manual gates.

Evidence:

```bash
npm run smoke:local
npm run smoke:production
npm test
```

## Batch 3: Privacy And Local-Safety Hardening

- Device-local APIs reject non-local hosts.
- Public API output and diagnostics avoid raw home paths, account identifiers, API keys, bearer tokens, OAuth/auth paths, raw profile paths, hidden profile basenames, and raw provider output.
- Sanitizer tests cover Settings, Chat, Setup Doctor, release readiness, Claude profile display, Claude project inventory, and diagnostics export.
- Privacy scan remains part of `npm run verify:release`.

Evidence:

```bash
npm run verify:release
```

## Batch 4: V1 UX Release Polish

Run this batch only for issues found during Batch 2 or Batch 3. Keep changes V1-only and scoped to current screens.

- Fix confusing labels, inert controls, missing disabled/loading feedback, overflow, inaccessible state text, or unclear recovery paths.
- Preserve the dense operational layout; do not introduce a marketing surface or V2 provider workbench.
- Verify any visual or interaction change with focused tests and a smoke or browser check.

## Batch 5: Release Automation And Cleanup

- `npm run verify:release` remains the single trusted automated gate.
- `npm run release:evidence -- --gate-result passed` prints a sanitized release evidence summary after a verified gate.
- `npm run release:prepare` runs cleanup dry-runs, runs the release gate once, and prints the sanitized evidence summary.
- Cleanup dry-runs report repo-owned process and artifact state before final release evidence is updated.
- Release docs avoid duplicated stale command lists and point back to the maintained runbook.

Evidence:

```bash
npm run cleanup:project:dry-run
npm run cleanup:artifacts:dry-run
npm run verify:release
npm run release:evidence -- --gate-result passed
git status --short --branch
```

## Batch 6: Final Automated Release Candidate

- Full release gate passes from the current checkout.
- Latest local QA evidence is updated with the final automated result.
- GitHub issue #3 is updated with sanitized automated status.
- No Codex-controlled V1 blocker remains open.

V1 can be called automated-ready after Batch 6. It can be called fully shipped only after the manual gates below are actually completed.

## Manual Gates

These checks require the local user and must not be simulated as passed:

- Native OS folder picker visibility, cancel behavior, and harmless folder selection.
- Visible Claude Open Login launch, including user-controlled cancel or completion.
- Provider auth test for the intended local provider/profile.
- First real account-backed chat.
- Sanitization review of Settings, Chat, and Diagnostics during the manual session.

Record results in Settings Manual QA Evidence and keep any public notes sanitized.
