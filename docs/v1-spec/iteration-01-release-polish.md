# Iteration 01: Release Polish

## Goal

Make the current V1 app safer, clearer, and easier to ship without adding new Claude ecosystem surfaces.

## Success Criteria

- A new local user can configure workspace paths, select provider mode, rebuild the index, test Claude CLI, and send a first chat from visible UI states.
- Setup Doctor distinguishes blocking errors from quality warnings.
- Chat send behavior is clear when provider or index readiness is not good.
- Docs and diagnostics remain sanitized.

## In Scope

- First-run checklist improvements.
- Setup Doctor wording and grouping improvements.
- Chat readiness and empty-state polish.
- Settings copy and status badge polish.
- Browser smoke runbook or checklist.

## Out Of Scope

- New provider registry.
- Skill import flows.
- Claude ecosystem inventory.
- LLM-generated diagnosis.

## Public Interfaces

No breaking API changes.

Allowed additive fields:

```ts
type ReadinessSeverity = "blocking" | "warning" | "optional";

interface DoctorCheck {
  severity?: ReadinessSeverity;
}

interface ChatStatus {
  canSend?: boolean;
  blockingReason?: string | null;
  suggestedAction?: string | null;
}
```

## Likely Modules

- `src/lib/settings/doctor.ts`
- `src/app/api/chat/status/route.ts`
- `src/app/settings/page.tsx`
- `src/app/chat/page.tsx`
- `src/components/layout/Sidebar.tsx`
- `README.md`

## Checklist

- [x] Add tests for Doctor severity mapping.
- [x] Add `severity` to Doctor checks without changing existing `status` semantics.
- [x] Add tests for chat readiness response when provider is missing, CLI disabled, index missing, index stale, and ready.
- [x] Add optional `canSend`, `blockingReason`, and `suggestedAction` to `/api/chat/status`.
- [x] Update Chat header/status row to show provider, runtime source, index state, and smoke-test state in compact text.
- [x] Disable or clearly warn before send only when `canSend` is false.
- [x] Replace generic empty-state prompts with prompts derived from current skill names when available.
- [x] Update Settings first-run checklist to show ordered actions: workspace, index, provider, smoke test, first chat.
- [x] Add sanitized diagnostics copy action or document why it remains export-only.
- [x] Update README with the V1 first-run path.

## Tests

- Unit/API:
  - `npx --yes tsx src/lib/settings/doctor.test.ts`
  - `npx --yes tsx src/app/api/chat/status/route.test.ts`
- Existing safety:
  - `npx --yes tsx src/app/api/settings/local-guards.test.ts`
- Final gates:
  - `npm run lint`
  - `npm run build`

## Browser Smoke

- Open `/settings`.
- Confirm first-run checklist renders.
- Confirm Setup Doctor top recommendation renders.
- Confirm `Test CLI` and `Open Login` buttons keep disabled/loading states.
- Open `/chat`.
- Confirm readiness row renders.
- Confirm stale/missing index warning offers `Rebuild Index`.
- Confirm send/retry flow still works with mocked or available provider state.

## Privacy Acceptance

- `/api/settings/doctor` contains no raw home paths, account identifiers, API keys, or raw provider output.
- `/api/chat/status` contains no raw profile paths or provider secrets.
- Settings UI does not display raw Claude profile folder names.

## Checkpoint Recommendation

Checkpoint as `feat(v1): polish release readiness` only after tests, build, and browser smoke pass.

## Implementation Evidence

Implemented in checkpoint `66b56ba feat(release-polish): add chat readiness and setup doctor polish`.

Verification completed on 2026-06-14:

- `npx --yes tsx src/lib/settings/doctor.test.ts`
- `npx --yes tsx src/app/api/chat/status/route.test.ts`
- `npx --yes tsx src/app/api/settings/local-guards.test.ts`
- `npx --yes tsx src/app/api/index/route.test.ts`
- Privacy placeholder scan over README, V1 docs, Settings, Chat, Chat status, and Doctor files.
- `npm run lint`
- `cmd.exe /c npm run build`
- Live `/settings` browser smoke: Doctor rows, severity labels, top actions, first-run checklist, active values, and no recent console errors.
- Live `/chat` browser smoke: readiness badges, blocked send state, disabled send, suggested prompts, and no recent console errors.
- `git diff --check`
