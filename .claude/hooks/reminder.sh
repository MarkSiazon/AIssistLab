#!/bin/bash
# ============================================================
# Reminder — SessionStart (startup + compact)
# Stdout is injected into Claude's context at session start
# and after context compaction, keeping conventions fresh.
# ============================================================

cat << 'REMINDER'
## Workspace Context (auto-injected by reminder hook)

**Project:** Claude Code skill development workspace
**Root:** `C:/Codes Local/Workshop - Claude Code CLI/`

### Key Paths
| Path | Purpose |
|------|---------|
| `.claude/skills/<name>/SKILL.md` | Skill files (directory form, preferred) |
| `.claude/skills/<name>.md` | Skill files (single-file form) |
| `.claude/hooks/` | Hook scripts (this file lives here) |
| `.claude/settings.json` | Hook config (hooks wiring + MCP enable flag) |
| `.mcp.json` | MCP server definitions (context7) |
| `rag-interface/` | Next.js 14 RAG web app for managing skills |
| `rag-interface/src/lib/rag/` | TF-IDF indexer, retriever, Claude generator |
| `rag-interface/src/app/api/` | API routes: chat, skills, export, settings |

### Skill File Format
Every skill MUST start with YAML frontmatter:
```
---
name: skill-name
description: One-line description shown in the UI
user-invokable: true
---
```
The body is a markdown prompt. Use `$ARGUMENTS` for user-passed args.

### Hooks in This Project
| Hook | Event | Purpose |
|------|-------|---------|
| `safety-gate.sh` | PreToolUse/Bash | Blocks destructive commands |
| `formatter.sh` | PostToolUse/Edit+Write | Auto-formats edited files |
| `reminder.sh` | SessionStart | Injects this context (you're reading it) |

### Active MCP Servers
| Server | How to use |
|--------|-----------|
| `context7` | Add `use context7` to any prompt involving a third-party library. It injects live, version-accurate docs into context. Example: "How do I stream in Next.js App Router? use context7" |

### Active Skill
- **`pr-description`** — generates PR title, description, changelog entry, commit hygiene report

### RAG Interface Stack
Next.js 14 · TypeScript · Tailwind · `@anthropic-ai/sdk` · `natural` (TF-IDF) · `swr`
Model used: `claude-sonnet-4-6`

REMINDER

exit 0
