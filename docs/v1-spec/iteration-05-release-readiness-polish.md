# Iteration 05: Release Readiness Polish

## Goal

Unify existing V1 readiness signals into a compact Release Readiness Center so a local user can see whether the app is ready for first chat, diagnostics export, and release review.

## Success Criteria

- Settings shows one V1 release readiness summary above detailed Doctor panels.
- Chat blocked states link directly to Settings and Diagnostics Export.
- Export shows a diagnostics readiness preview before any download.
- The readiness API is deterministic, local-only, and sanitized.
- No V2 provider registry or automatic repair behavior is introduced.

## In Scope

- Release readiness aggregation from existing Doctor, Chat status, RAG index, skill quality, Claude project inventory, and runtime provider status.
- Additive local-only API route.
- Settings, Chat, and Export UI polish.
- Docs update for the V1 release path.

## Out Of Scope

- Automatic login, smoke tests, export, index rebuild, or filesystem fixes.
- Provider-agnostic V2 adapter work.
- Persistent diagnostics-export completion state.
- New LLM-generated diagnosis.

## Public Interfaces

Add local-only endpoint:

```ts
GET /api/release/readiness

type ReleaseReadinessStatus = "ready" | "needs_action" | "blocked";

interface ReleaseReadinessResponse {
  schemaVersion: 1;
  generatedAt: string;
  summary: {
    status: ReleaseReadinessStatus;
    score: number;
    topAction: string | null;
    canChat: boolean;
    canExportDiagnostics: boolean;
  };
  sections: Array<{
    id:
      | "workspace"
      | "provider"
      | "index"
      | "skills"
      | "claude_project"
      | "chat"
      | "diagnostics";
    label: string;
    status: ReleaseReadinessStatus;
    message: string;
    actionLabel?: string;
    actionHref?: string;
  }>;
}
```

## Likely Modules

- `src/lib/release/readiness.ts`
- `src/app/api/release/readiness/route.ts`
- `src/lib/chat/readiness.ts`
- `src/lib/settings/doctor-report.ts`
- `src/app/settings/page.tsx`
- `src/app/chat/page.tsx`
- `src/app/export/page.tsx`
- `README.md`

## Checklist

- [x] Add failing tests for pure readiness aggregation.
- [x] Add failing tests for local-only API guard and sanitized response shape.
- [x] Extract chat readiness rules into a shared helper.
- [x] Extract current Setup Doctor assembly into a reusable server helper.
- [x] Add `/api/release/readiness`.
- [x] Add Settings `V1 Release Readiness` panel.
- [x] Add Chat blocked-state links to Settings and Diagnostics Export.
- [x] Add Export diagnostics readiness preview.
- [x] Update README and V1 spec index.

## Tests

- `npx --yes tsx src/lib/release/readiness.test.ts`
- `npx --yes tsx src/app/api/release/readiness/route.test.ts`
- `npx --yes tsx src/lib/settings/doctor.test.ts`
- `npx --yes tsx src/app/api/chat/status/route.test.ts`
- `npx --yes tsx src/app/api/export/zip/route.test.ts`
- `npx --yes tsx src/app/api/settings/local-guards.test.ts`
- `npm run lint`
- `cmd.exe /c npm run build`

## Browser Smoke

- Open `/settings` and confirm `V1 Release Readiness` renders above detailed Doctor sections.
- Confirm a bad or incomplete setup shows `Blocked` or `Needs action`.
- Open `/chat` and confirm blocked auth/provider states show Settings and Diagnostics links.
- Open `/export` and confirm diagnostics readiness preview renders without triggering a download.
- Confirm no console errors on the touched pages.

## Privacy Acceptance

- `/api/release/readiness` returns no raw home paths, emails, API keys, OAuth paths, Claude profile basenames, hook commands, MCP args, headers, or raw provider output.
- The UI only renders sanitized messages from the readiness API.
- Diagnostics export remains explicitly user-triggered.

## Checkpoint Recommendation

Checkpoint as `feat(release): add V1 readiness center` only after targeted tests, lint, build, privacy scan, and browser smoke pass.
