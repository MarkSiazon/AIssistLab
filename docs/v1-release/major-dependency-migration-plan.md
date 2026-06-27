# Major Dependency Migration Plan

This plan keeps major dependency work on `dev` until a verified checkpoint is ready for `main`. Each batch should be committed separately on `dev` and must pass `npm run verify:release` before the next batch starts.

## Current Baseline

- Release baseline: `v1.0.0-rc.1` at `56463ce32138aa88336a88c13a47471abbc0e764`.
- Runtime: Node 25.2.1 and npm 11.11.0 in the current local environment.
- Current app stack: Next.js 16.2.9, React 18.3.1, Tailwind 3.4.19, TypeScript 5.9.3, ESLint 9.39.4, Anthropic SDK 0.78.0, Archiver 7.0.1.
- Latest major targets observed during planning: React 19.2.7, Tailwind 4.3.1, TypeScript 6.0.3, ESLint 10.5.0, Anthropic SDK 0.106.0, Archiver 8.0.0.

## Branch And Commit Policy

- Work only on `dev` until explicitly promoted.
- Do not modify `main` during migration batches.
- Use one commit per batch with a conventional commit subject.
- Stop after any failed release gate and fix within the same batch before continuing.
- Do not combine Tailwind, React, TypeScript, ESLint, SDK, and Archiver major upgrades into one commit.

## Batch Order

1. Tooling batch: upgrade TypeScript 6 and ESLint 10 together with any required config/test fixes.
2. React batch: upgrade React 19, React DOM 19, `@types/react`, and `@types/react-dom`.
3. Tailwind batch: upgrade Tailwind 4 and update CSS/PostCSS config according to the current Tailwind migration requirements.
4. Runtime library batch: upgrade Anthropic SDK 0.106 and Archiver 8 with focused API/stream/export verification.

## Verification Per Batch

Run these before committing each batch:

```bash
npm test
npm run lint
npm run build
npm run smoke:local
npm run smoke:production
npm run audit:dead-code
npm run audit:exports
npm run verify:release
git diff --check
```

After verification, remove generated local artifacts:

```bash
npm run cleanup:artifacts
npm run cleanup:project:dry-run
```

## Batch Risks

- TypeScript 6 may expose stricter inference or library type changes in route handlers, React components, and script helpers.
- ESLint 10 may require config changes for `eslint.config.mjs` or Next's ESLint adapter.
- React 19 can change hydration/runtime behavior and type expectations for component props, refs, and actions.
- Tailwind 4 can change PostCSS setup and CSS entrypoint syntax; inspect `src/app/globals.css`, `postcss.config.mjs`, and Tailwind config before editing.
- Anthropic SDK 0.106 can change streaming event types used by `src/lib/rag/generator.ts`.
- Archiver 8 can change typings or stream behavior used by diagnostics ZIP generation.

## Acceptance Criteria

- All batches land on `dev` with passing `npm run verify:release`.
- Manual QA may remain skipped, but release notes must not claim manual verification.
- `main` is updated only after explicit approval and a final clean diff review.
