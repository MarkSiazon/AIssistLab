export const privacyScanPattern = String.raw`C:[\\/]Users[\\/][^\\/\s"]+|sk-ant-(?!private)[A-Za-z0-9_-]{6,}|Bearer\s+[A-Za-z0-9._-]{20,}|oauth[.]json|[.]claude-profiles[\\/](?!/|<[^>]+>)[^\s"\\/]+`;

export const privacyScanSuccessMessage =
  "No private paths, account identifiers, API keys, auth paths, or bearer tokens found.";

const unsafePatterns = [
  [/C:\\Users[\\/]/i, "Windows home path"],
  [/\/Users\/[^/\s"]+/i, "macOS home path"],
  [/\/home\/[^/\s"]+/i, "Linux home path"],
  [/sk-ant-[A-Za-z0-9_-]+/i, "Anthropic API key"],
  [/Bearer\s+[A-Za-z0-9._-]+/i, "Bearer token"],
  [/oauth\.json/i, "OAuth file path"],
  [/\.claude-profiles[\\/](?!<[^>]+>)[^\s"\\/]+/i, "raw Claude profile path"],
];

export function assertNoUnsafe(label, value) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  for (const [pattern, description] of unsafePatterns) {
    if (pattern.test(text)) {
      throw new Error(`${label} leaked ${description}`);
    }
  }
}
