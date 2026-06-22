# Claude Ecosystem Research

This file captures official Claude and Anthropic sources that should guide V1. It intentionally avoids leaked/internal material and does not treat third-party claims as product truth.

## Skills

Sources:

- [Claude Code skills docs](https://code.claude.com/docs/en/skills)
- [Agent Skills API docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [Anthropic skills repository](https://github.com/anthropics/skills)

Key implications for V1:

- A skill is a directory with `SKILL.md` as the entrypoint and optional supporting files such as examples, templates, references, and scripts.
- Skills can be invoked directly or loaded when Claude decides they are relevant.
- Project skills, personal skills, enterprise-managed skills, commands, and plugin skills have different scopes and precedence.
- Current Claude Code docs say custom commands have merged into skills conceptually, but existing command files still work.
- Claude Code adds features beyond the open Agent Skills standard, including invocation control, subagent execution, dynamic context injection, path restrictions, and tool restrictions.
- `description` is the key field for skill discovery, and descriptions should lead with the use case.

V1 opportunity:

- Upgrade Skill Quality Doctor to validate official-style fields and explain how each issue affects invocation, sharing, or context cost.
- Add a Template Gallery that teaches the difference between reference skills, workflow skills, command-style skills, and subagent-backed skills.
- Add import preview for skill folders with supporting-file awareness.

## Commands

Source:

- [Claude Code commands reference](https://code.claude.com/docs/en/commands)

Key implications for V1:

- Commands control Claude Code sessions and include built-ins, bundled skills, and workflows.
- The commands docs position skills as the way to add custom commands.
- Commands such as `/skills`, `/reload-skills`, `/mcp`, `/agents`, `/doctor`, `/code-review`, `/batch`, `/run`, and `/verify` show that Claude Code is becoming a broader workflow surface.

V1 opportunity:

- Add read-only inventory for project command files.
- Explain command/skill overlap in the UI.
- Suggest `/reload-skills` when a user changes skill content and the active Claude session may need a reload.

## Subagents

Source:

- [Claude Code subagents docs](https://code.claude.com/docs/en/sub-agents)

Key implications for V1:

- Subagents are Markdown files with YAML frontmatter and a system prompt body.
- Subagents can be personal, project-level, plugin-provided, or managed.
- Subagent definitions include tool restrictions, model choice, permission mode, skills to preload, memory, background behavior, and worktree isolation.
- Project-level subagents are useful for team-shared workflows.

V1 opportunity:

- Add read-only project subagent inventory.
- Add a future template for skill content that is meant to run in a subagent.
- Warn when subagent names appear duplicated or missing required frontmatter.

## MCP

Source:

- [Claude Code MCP docs](https://code.claude.com/docs/en/mcp)

Key implications for V1:

- MCP connects Claude Code to external tools and data sources.
- Project-scoped MCP servers can be shared through `.mcp.json`.
- MCP servers have local and remote transports, auth flows, status commands, output limits, and prompt/resource surfaces.
- Claude Code can also expose its own tools as an MCP server.

V1 opportunity:

- Add read-only `.mcp.json` inventory and schema sanity checks.
- Show MCP readiness as a local project diagnostic, not as a managed credential viewer.
- Detect high-risk patterns such as broad local command servers and missing project documentation.

## Settings And Hooks

Sources:

- [Claude Code settings docs](https://code.claude.com/docs/en/settings)
- [Claude Code hooks guide](https://code.claude.com/docs/en/hooks-guide)

Key implications for V1:

- Claude Code settings are scoped as managed, user, project, and local.
- Project settings are shared with collaborators; local settings are machine-specific.
- Many settings reload in a running session, while some require restart or a command.
- Hooks are lifecycle automation points and can run commands or external endpoints.

V1 opportunity:

- Add read-only settings and hooks inventory.
- Make Setup Doctor explain which project-level config is shareable and which local config should stay private.
- Add privacy warnings for config files that may contain machine-specific paths or secrets.

## Agent SDK

Source:

- [Claude Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview)

Key implications for V1:

- The Agent SDK provides the same broad agent loop and tool model that powers Claude Code, but as a library.
- Official docs position CLI for one-off and interactive development, and SDK for production automation.

V1 opportunity:

- Keep V1 on the CLI/API path.
- Document SDK as a future integration track, not a V1 dependency.
- Avoid adding SDK behavior until the local CLI product is polished.

## Claude Education

Source:

- [Introducing Claude for Education](https://www.anthropic.com/news/introducing-claude-for-education)

Key implications for V1:

- Learning Mode emphasizes guiding rather than answering, Socratic questioning, core concepts, templates, and rubrics.
- Education use cases include research, writing, feedback, rubrics, and administrative knowledge conversion.

V1 opportunity:

- Add Guided Skill Builder that asks users to define purpose, audience, trigger examples, inputs, boundaries, and quality criteria before drafting.
- Add rubric feedback for skill drafts instead of one-click generation.
- Add templates and examples that help users learn why a skill is structured a certain way.
