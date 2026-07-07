import { existsSync } from "node:fs";
import { createRequire } from "node:module";

const defaultRequire = createRequire(import.meta.url);

/**
 * Resolve a ripgrep executable path for release tooling.
 *
 * Prefers the binary bundled by the `@vscode/ripgrep` devDependency so the
 * release gate runs on machines without a system-wide ripgrep install, and
 * falls back to a PATH-resolved `rg` when the bundle is unavailable.
 */
export function resolveRipgrepPath({
  requireModule = defaultRequire,
  fileExists = existsSync,
} = {}) {
  try {
    const { rgPath } = requireModule("@vscode/ripgrep");
    if (typeof rgPath === "string" && rgPath.length > 0 && fileExists(rgPath)) {
      return rgPath;
    }
  } catch {
    // Package not installed or unresolvable; fall back to PATH.
  }
  return "rg";
}
