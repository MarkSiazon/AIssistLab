#!/bin/bash
# ============================================================
# Safety Gate — PreToolUse / Bash
# Blocks destructive or irreversible shell commands before
# they are executed.  Exit 2 = blocked (stderr fed to Claude).
# Uses Node.js for JSON parsing (python3 not required).
# ============================================================

INPUT=$(cat)

# Extract command via Node.js
COMMAND=$(echo "$INPUT" | node -e "
let d='';
process.stdin.on('data',c=>d+=c);
process.stdin.on('end',()=>{
  try{ const o=JSON.parse(d); console.log(o.tool_input&&o.tool_input.command||''); }
  catch(e){ console.log(''); }
});
" 2>/dev/null)

# Fallback: grep + sed if Node unavailable
if [ -z "$COMMAND" ]; then
    COMMAND=$(echo "$INPUT" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | tail -1)
fi

if [ -z "$COMMAND" ]; then
    exit 0
fi

block() {
    echo "Safety Gate blocked: $1" >&2
    echo "  Command: $COMMAND" >&2
    exit 2
}

# ── 1. Fork bomb ────────────────────────────────────────────
if echo "$COMMAND" | grep -qE ':\(\)\s*\{'; then
    block "fork bomb pattern detected"
fi

# ── 2. Recursive delete of root or all files ────────────────
if echo "$COMMAND" | grep -qE 'rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)\s+/\s*$'; then
    block "recursive delete targeting root filesystem"
fi
if echo "$COMMAND" | grep -qE 'rm\s+-rf\s+/\*?|rm\s+-fr\s+/\*?'; then
    block "recursive delete targeting root filesystem"
fi

# ── 3. Force-push to main / master ──────────────────────────
if echo "$COMMAND" | grep -qE 'git\s+push.*(--force|-f).*\b(main|master)\b'; then
    block "force-push to protected branch (main/master)"
fi
if echo "$COMMAND" | grep -qE 'git\s+push\s+(--force|-f)\s+origin\s*$'; then
    block "bare force-push to origin (may overwrite main)"
fi

# ── 4. Hard-reset to remote HEAD ────────────────────────────
if echo "$COMMAND" | grep -qE 'git\s+reset\s+--hard\s+origin/(main|master)'; then
    block "hard reset to remote main/master"
fi

# ── 5. Disk format (Windows) ────────────────────────────────
if echo "$COMMAND" | grep -qiE '^format\s+[a-zA-Z]:|mkfs\.'; then
    block "disk format command"
fi

# ── 6. Destructive SQL ──────────────────────────────────────
if echo "$COMMAND" | grep -qiE '\b(DROP\s+(TABLE|DATABASE|SCHEMA)|TRUNCATE\s+TABLE)\b'; then
    block "destructive SQL statement"
fi

# ── 7. Deleting .env files ──────────────────────────────────
if echo "$COMMAND" | grep -qE 'rm\s+.*\.env'; then
    block "deleting .env file — edit it instead"
fi

# ── 8. Piping remote scripts directly into shell ─────────────
if echo "$COMMAND" | grep -qE '(curl|wget).+\|\s*(ba)?sh'; then
    block "piping remote script directly into shell (supply chain risk)"
fi

exit 0
