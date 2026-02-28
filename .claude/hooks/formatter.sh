#!/bin/bash
# ============================================================
# Formatter — PostToolUse / Edit + Write
# Runs after Claude edits or writes a file.
# • .md  → trims trailing whitespace, ensures final newline
# • .ts / .tsx / .js / .jsx → runs Prettier if available
# • .json → validates and pretty-prints (2-space indent)
# Non-blocking: always exits 0 (PostToolUse cannot block).
# Uses Node.js for JSON parsing (python3 not required).
# ============================================================

INPUT=$(cat)

# Extract file_path via Node.js
FILE_PATH=$(echo "$INPUT" | node -e "
let d='';
process.stdin.on('data',c=>d+=c);
process.stdin.on('end',()=>{
  try{ const o=JSON.parse(d); console.log(o.tool_input&&o.tool_input.file_path||''); }
  catch(e){ console.log(''); }
});
" 2>/dev/null)

# Fallback: grep + sed
if [ -z "$FILE_PATH" ]; then
    FILE_PATH=$(echo "$INPUT" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
fi

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
    exit 0
fi

EXT="${FILE_PATH##*.}"

# ── Markdown: trim trailing whitespace + ensure final newline ──
if [ "$EXT" = "md" ]; then
    node -e "
const fs = require('fs');
const p = process.argv[1];
let text = fs.readFileSync(p, 'utf8');
const cleaned = text.split('\n').map(l => l.replace(/\s+$/, '')).join('\n').replace(/\n*$/, '\n');
if (cleaned !== text) {
  fs.writeFileSync(p, cleaned);
  process.stderr.write('[formatter] Normalized: ' + require('path').basename(p) + '\n');
}
" "$FILE_PATH" 2>&1 >&2
    exit 0
fi

# ── TypeScript / JavaScript: Prettier (if available) ──────────
if [[ "$EXT" =~ ^(ts|tsx|js|jsx|mjs|cjs)$ ]]; then
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    RAG_DIR="$(cd "$SCRIPT_DIR/../../rag-interface" 2>/dev/null && pwd || echo "")"
    PRETTIER="$RAG_DIR/node_modules/.bin/prettier"
    if [ -n "$RAG_DIR" ] && [ -f "$PRETTIER" ]; then
        "$PRETTIER" --write "$FILE_PATH" 2>/dev/null \
            && echo "[formatter] Prettier: $(basename "$FILE_PATH")" >&2
    else
        echo "[formatter] Prettier not found, skipping $(basename "$FILE_PATH")" >&2
    fi
    exit 0
fi

# ── JSON: validate + pretty-print via Node.js ─────────────────
if [ "$EXT" = "json" ]; then
    node -e "
const fs = require('fs');
const p = process.argv[1];
try {
  const text = fs.readFileSync(p, 'utf8');
  const pretty = JSON.stringify(JSON.parse(text), null, 2) + '\n';
  if (pretty !== text) {
    fs.writeFileSync(p, pretty);
    process.stderr.write('[formatter] Pretty-printed: ' + require('path').basename(p) + '\n');
  }
} catch(e) {
  process.stderr.write('[formatter] WARNING invalid JSON in ' + require('path').basename(p) + ': ' + e.message + '\n');
}
" "$FILE_PATH" 2>&1 >&2
    exit 0
fi

exit 0
