import { isSafeInternalActionHref } from "./internal-action-href";

export function assignSafeInternalLocation(
  location: { href: string },
  href: string | undefined,
): boolean {
  if (!isSafeInternalActionHref(href)) return false;
  location.href = href;
  return true;
}
