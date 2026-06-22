import { getBrowserSessionStorage } from "@/lib/ui/browser-storage";

const DIAGNOSTICS_EXPORT_SESSION_KEY =
  "skill-workshop-first-run-diagnostics-exported";
const DIAGNOSTICS_EXPORT_SESSION_WINDOW_TOKEN =
  "__skill_workshop_first_run_diagnostics_exported__";

export function isDiagnosticsExportedThisSession(): boolean {
  if (typeof window === "undefined") return false;

  try {
    if (
      getBrowserSessionStorage()?.getItem(DIAGNOSTICS_EXPORT_SESSION_KEY) ===
      "true"
    ) {
      return true;
    }
  } catch {
    // Some embedded browser contexts restrict storage access.
  }

  return window.name.includes(DIAGNOSTICS_EXPORT_SESSION_WINDOW_TOKEN);
}

export function markDiagnosticsExportedThisSession() {
  if (typeof window === "undefined") return;

  try {
    getBrowserSessionStorage()?.setItem(DIAGNOSTICS_EXPORT_SESSION_KEY, "true");
  } catch {
    // Some embedded browser contexts restrict storage access.
  }

  if (!window.name.includes(DIAGNOSTICS_EXPORT_SESSION_WINDOW_TOKEN)) {
    window.name = window.name
      ? `${window.name} ${DIAGNOSTICS_EXPORT_SESSION_WINDOW_TOKEN}`
      : DIAGNOSTICS_EXPORT_SESSION_WINDOW_TOKEN;
  }
}
