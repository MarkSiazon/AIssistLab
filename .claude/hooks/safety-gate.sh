#!/bin/bash
# ============================================================
# Safety Gate - PreToolUse / Bash
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

# -- 1. Fork bomb ------------------------------------------------
# Pattern: :(){ :|:& };:
if echo "$COMMAND" | grep -qE ':\(\)[[:space:]]*\{'; then
    block "fork bomb pattern detected"
fi

# -- 2. Recursive delete of root or all files --------------------
# Covers: rm -rf /, rm -fr /, rm -r -f /, rm -rf /*
if echo "$COMMAND" | grep -qE 'rm[[:space:]]+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)[[:space:]]+/[[:space:]]*$'; then
    block "recursive delete targeting root filesystem"
fi
if echo "$COMMAND" | grep -qE 'rm[[:space:]]+-rf[[:space:]]+/([*])?([[:space:]]|$)|rm[[:space:]]+-fr[[:space:]]+/([*])?([[:space:]]|$)'; then
    block "recursive delete targeting root filesystem"
fi
if echo "$COMMAND" | grep -qE 'rm[[:space:]]+-r[[:space:]]+-f[[:space:]]+/([*])?([[:space:]]|$)|rm[[:space:]]+-f[[:space:]]+-r[[:space:]]+/([*])?([[:space:]]|$)'; then
    block "recursive delete targeting root filesystem"
fi

# -- 3. Force-push to main / master ------------------------------
# Detect any `git push` that includes --force or -f (anywhere in the args)
if echo "$COMMAND" | grep -qE 'git[[:space:]]+push'; then
    if echo "$COMMAND" | grep -qE -- '--force' || \
       echo "$COMMAND" | grep -qE -- '[[:space:]]-f([[:space:]]|$)' || \
       echo "$COMMAND" | grep -qE -- '^git[[:space:]]+push[[:space:]]+-f'; then
        if echo "$COMMAND" | grep -qE '(^|[[:space:]])([^[:space:]]+:)?(refs/heads/)?(main|master)([[:space:]]|$)'; then
            block "force-push to protected branch (main/master)"
        fi
    fi
fi
if echo "$COMMAND" | grep -qE 'git[[:space:]]+push[[:space:]]+(--force|-f)[[:space:]]+origin[[:space:]]*$'; then
    block "bare force-push to origin (may overwrite main)"
fi

# -- 4. Hard-reset to remote HEAD --------------------------------
if echo "$COMMAND" | grep -qE 'git[[:space:]]+reset[[:space:]]+--hard[[:space:]]+origin/(main|master)'; then
    block "hard reset to remote main/master"
fi

# -- 5. Disk format (Windows) ------------------------------------
if echo "$COMMAND" | grep -qiE '^format[[:space:]]+[a-zA-Z]:|mkfs\.'; then
    block "disk format command"
fi

# -- 6. Destructive SQL ------------------------------------------
if echo "$COMMAND" | grep -qiE '(DROP[[:space:]]+(TABLE|DATABASE|SCHEMA)|TRUNCATE[[:space:]]+TABLE)'; then
    block "destructive SQL statement"
fi

# -- 7. Deleting .env files --------------------------------------
if echo "$COMMAND" | grep -qE 'rm[[:space:]]+.*\.env'; then
    block "deleting .env file - edit it instead"
fi

# -- 8. Piping remote scripts directly into shell -----------------
if echo "$COMMAND" | grep -qE '(curl|wget).+\|[[:space:]]*(ba)?sh'; then
    block "piping remote script directly into shell (supply chain risk)"
fi

exit 0
