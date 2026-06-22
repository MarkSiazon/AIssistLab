# Iteration 03: Claude Code Cockpit

## Goal

Add read-only awareness of the broader Claude Code project surface so users can see skills, commands, agents, MCP, settings, hooks, and plugin-style folders from one local dashboard.

## Success Criteria

- The app inventories project-level Claude Code config without writing changes.
- Setup Doctor reports Claude project readiness in a new group.
- The UI explains project-shared versus local-only configuration.
- Sensitive local/user-level config remains hidden.

## In Scope

- Read-only filesystem scan inside configured workspace root.
- Project-level `.claude` and `.mcp.json` inventory.
- Generic warnings and suggested fixes.
- Settings sidebar or new panel for Claude Project inventory.

## Out Of Scope

- Writing `.claude` config.
- Installing hooks, agents, MCP servers, plugins, or skills.
- Reading user-level credential stores.
- Live hook observability.

## Public Interfaces

Add local-only endpoint:

```ts
interface ClaudeProjectInventory {
  workspaceDisplay: string;
  counts: {
    skills: number;
    commands: number;
    agents: number;
    mcpServers: number;
    hooks: number;
    pluginFolders: number;
  };
  checks: Array<{
    id: string;
    status: "ok" | "warn" | "error";
    title: string;
    message: string;
    suggestedFix?: string;
  }>;
  reloadHints: string[];
}
```

Endpoint:

- `GET /api/settings/claude-project`

## Likely Modules

- New `src/lib/claude/project-inventory.ts`
- `src/lib/settings/doctor.ts`
- `src/app/settings/page.tsx`
- New `src/app/api/settings/claude-project/route.ts`

## Checklist

- [x] Add tests for project inventory with temporary workspace fixtures.
- [x] Detect `.claude/skills/*/SKILL.md` and `.claude/commands/*.md`.
- [x] Detect `.claude/agents/**/*.md` and validate required `name` and `description` frontmatter.
- [x] Detect `.mcp.json` and count configured server entries without returning command args or headers.
- [x] Detect `.claude/settings.json` and `.claude/settings.local.json` existence and classify shared versus local.
- [x] Detect hook configuration only as count/category, not raw command details.
- [x] Detect plugin-style folders by `.claude-plugin/plugin.json`.
- [x] Add reload hints for skills, plugins, settings, and session restart based on file types.
- [x] Add `/api/settings/claude-project` with localhost guard.
- [x] Add Setup Doctor group `Claude Project`.
- [x] Add Settings UI section with counts, warnings, and explanation text.
- [x] Add diagnostics export summary for inventory without raw config contents.

## Tests

- New:
  - `npx --yes tsx src/lib/claude/project-inventory.test.ts`
  - `npx --yes tsx src/app/api/settings/claude-project/route.test.ts`
- Existing:
  - `npx --yes tsx src/lib/settings/doctor.test.ts`
  - `npx --yes tsx src/app/api/settings/local-guards.test.ts`
  - `npx --yes tsx src/app/api/export/zip/route.test.ts`
- Final gates:
  - `npm run lint`
  - `npm run build`

## Browser Smoke

- Open `/settings`.
- Confirm Claude Project inventory section renders.
- Confirm counts update against a fixture or sample workspace.
- Confirm local-only settings are labeled as local.
- Confirm suggested fixes are text only.

## Privacy Acceptance

- Inventory API does not include raw MCP command args, headers, tokens, full home paths, account names, or local credential paths.
- Hook commands are summarized by presence/count only.
- Settings file contents are not serialized.

## Checkpoint Recommendation

Checkpoint as `feat(settings): add Claude project inventory` only after tests, build, and browser smoke pass.

## Implementation Evidence

- Added read-only Claude project inventory, local-only API route, Setup Doctor group, Settings sidebar panel, and diagnostics ZIP summary.
- Verified inventory privacy for workspace paths, emails, token-like values, MCP command args/headers, hook commands, and settings contents.
- Browser smoke used a temporary workspace and confirmed `/settings` renders counts, shared/local settings labels, reload hints, and zero console errors.
