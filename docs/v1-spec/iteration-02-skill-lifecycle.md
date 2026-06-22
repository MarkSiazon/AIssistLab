# Iteration 02: Skill Lifecycle

## Goal

Turn the current skill editor into a safer skill lifecycle manager with templates, import preview, stronger quality checks, and safer deletion.

## Success Criteria

- Users can start from vetted skill templates.
- Users can preview an import before any files are written.
- Skill Quality Doctor v2 reports actionable quality categories.
- Delete and restore behavior protects against accidental data loss.

## In Scope

- Template gallery.
- Import preview for local folder, archive, and GitHub URL.
- Validation and quality rule expansion.
- Safe delete/restore flow.
- Index stale behavior after skill changes.

## Out Of Scope

- Marketplace sync.
- Automatic installation from public catalogs.
- Background update checks.
- Provider-agnostic skill packaging.

## Public Interfaces

Additive API shape:

```ts
interface SkillTemplate {
  id: string;
  label: string;
  description: string;
  category: "reference" | "workflow" | "command" | "subagent" | "learning";
  initialFrontmatter: Record<string, unknown>;
  initialBody: string;
}

interface SkillImportPreview {
  ok: boolean;
  sourceType: "folder" | "archive" | "github";
  skills: Array<{
    name: string;
    displayName: string;
    hasSkillFile: boolean;
    fileCount: number;
    validationErrors: unknown[];
    qualityWarnings: unknown[];
    duplicate: boolean;
  }>;
  warnings: string[];
}
```

Candidate endpoints:

- `GET /api/skills/templates`
- `POST /api/skills/import/preview`
- `POST /api/skills/import/apply`
- `POST /api/skills/:skillName/restore`

All endpoints remain localhost-only.

## Likely Modules

- `src/lib/skills/validation.ts`
- `src/lib/skills/quality.ts`
- `src/lib/skills/writer.ts`
- `src/app/skills/page.tsx`
- `src/components/editor/SkillEditorForm.tsx`
- New focused modules under `src/lib/skills/`

## Checklist

- [x] Add tests for template definitions and required fields.
- [x] Create a server-only template module with five templates: reference, workflow, command-style, subagent-backed, and learning/rubric.
- [x] Add template selection to the new skill page.
- [x] Add validation tests for official-style frontmatter fields such as `name`, `description`, `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context`, `agent`, `hooks`, `paths`, and `shell`.
- [x] Add quality tests for description clarity, trigger examples, supporting-file references, token weight, dynamic command usage, and unsafe instructions.
- [x] Implement Skill Quality Doctor v2 categories: discoverability, safety, maintainability, portability, and context cost.
- [x] Add import preview parser for local folder and archive sources.
- [x] Add GitHub URL import preview with shallow fetch and strict file-size limits.
- [x] Ensure import apply writes only after preview id and user confirmation.
- [x] Add duplicate handling: skip, overwrite, or rename must be explicit; duplicate overwrite requires typed UI confirmation.
- [x] Add safe delete by moving deleted skill to an app-controlled local backup before removal.
- [x] Add restore endpoint and UI affordance for latest deleted skill.
- [x] Set index state to stale after import, delete, overwrite, or restore.

## Tests

- New:
  - `npx --yes tsx src/lib/skills/templates.test.ts`
  - `npx --yes tsx src/lib/skills/importer.test.ts`
  - `npx --yes tsx src/lib/skills/trash.test.ts`
- Existing:
  - `npx --yes tsx src/lib/skills/validation.test.ts`
  - `npx --yes tsx src/lib/skills/quality.test.ts`
  - `npx --yes tsx src/app/api/skills/validation-route.test.ts`
- Final gates:
  - `npm run lint`
  - `cmd.exe /c npm run build`

## Browser Smoke

- Create a new skill from each template.
- Preview a local import without applying.
- Apply an import and confirm index becomes stale.
- Delete a skill with exact-name confirmation.
- Restore the deleted skill and confirm it appears in Skills.
- Confirm validation messages are visible and save is disabled while invalid.

## Privacy Acceptance

- Import preview does not reveal full home paths in response payloads.
- GitHub import preview does not execute scripts.
- Archive import rejects path traversal.
- Supporting-file previews are bounded and sanitized.

## Checkpoint Recommendation

Checkpoint as `feat(skills): add lifecycle templates and import preview` only after tests, build, and browser smoke pass.

## Implementation Evidence

- Added template, import preview/apply, local trash/restore, validation, and quality modules with focused assertion tests.
- Updated create/edit/delete flows so skill changes preserve official-style frontmatter, require exact delete confirmation, move deleted skills to an app-controlled local backup, refuse unsafe restore overwrites, and mark the RAG index stale.
- Updated Skills, Editor, and Settings UI for template selection, import preview/apply, invalid-preview blocking, restore affordance, semantic skill row buttons, and quality categories.
- Hardened import handling for oversized GitHub responses, zip entries with unsafe inflated output size, invalid preview apply, and non-local endpoint access.
- Verified with:
  - `npx --yes tsx src/lib/skills/templates.test.ts`
  - `npx --yes tsx src/lib/skills/reader.test.ts`
  - `npx --yes tsx src/lib/skills/importer.test.ts`
  - `npx --yes tsx src/lib/skills/trash.test.ts`
  - `npx --yes tsx src/lib/skills/validation.test.ts`
  - `npx --yes tsx src/lib/skills/quality.test.ts`
  - `npx --yes tsx src/app/api/skills/lifecycle-routes.test.ts`
  - `npm run lint`
  - `cmd.exe /c npm run build`
- Live browser smoke used a temporary workspace and confirmed `/settings`, `/chat`, template selection, invalid preview apply blocking, local import preview/apply, duplicate overwrite typed confirmation, exact-name delete, restore, stale-index notice, and zero console errors.
