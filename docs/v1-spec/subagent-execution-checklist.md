# Subagent Execution Checklist

Use this checklist when implementing V1 slices with multiple agents.

## Assignment Model

- Agent A: repo inventory, existing feature map, and affected file discovery.
- Agent B: official Claude docs validation and source citation checks.
- Agent C: similar-project inspiration scan and "copy/avoid" synthesis.
- Agent D: product sequencing and acceptance criteria.
- Agent E: implementation for one iteration.
- Agent F: privacy, local-only, source, and final diff review.

## Before Dispatch

- Confirm current branch and git state.
- Confirm no unrelated user changes will be touched.
- Assign exactly one iteration per implementation agent.
- Provide the relevant spec file and current README.
- Tell agents not to commit unless explicitly authorized.

## During Work

- Each agent keeps changes scoped to its iteration.
- Each agent updates docs when behavior, API, env, or user workflow changes.
- Each agent adds or updates targeted tests before UI polish.
- Agents do not edit V2 provider registry docs unless the task explicitly references V2.
- Agents do not install third-party skills, hooks, plugins, or MCP servers.

## Review Gates

- Gate 1: Tests for the slice pass.
- Gate 2: Browser smoke for touched pages passes.
- Gate 3: Privacy scan of touched public APIs passes.
- Gate 4: `git diff --check` passes.
- Gate 5: Final diff contains no unrelated files.

## Merge Or Checkpoint

- Request checkpoint commit only after all review gates pass.
- Use Conventional Commit format:
  - `feat(v1): ...` for new V1 capabilities.
  - `fix(v1): ...` for bug fixes.
  - `chore(docs): ...` for docs-only roadmap/spec updates.
- Do not push unless the user explicitly asks.

## Handoff Template

Each agent should return:

- What changed.
- Tests run and exit status.
- Browser smoke evidence.
- Privacy checks run.
- Files changed.
- Known blockers.
- Recommended next iteration.
