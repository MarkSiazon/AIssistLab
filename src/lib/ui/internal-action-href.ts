export function isSafeInternalActionHref(href: string | undefined): href is string {
  if (!href) return false;

  const trimmed = href.trim();
  if (trimmed !== href) return false;
  if (!trimmed || trimmed.startsWith("//")) return false;
  if (/[\s\\]/.test(trimmed)) return false;
  if (/%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(trimmed)) return false;
  const pathPart = trimmed.split(/[?#]/, 1)[0] ?? "";
  if (/%(?:2f|5c)/i.test(pathPart)) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return false;

  return trimmed.startsWith("/");
}
