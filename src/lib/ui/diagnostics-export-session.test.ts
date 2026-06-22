import assert from "node:assert/strict";
import {
  isDiagnosticsExportedThisSession,
  markDiagnosticsExportedThisSession,
} from "./diagnostics-export-session";

interface MockWindow {
  name: string;
  sessionStorage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
  };
}

function withMockWindow<T>(windowState: MockWindow, fn: () => T): T {
  const previousWindow = (globalThis as { window?: unknown }).window;
  (globalThis as { window?: MockWindow }).window = windowState;
  try {
    return fn();
  } finally {
    (globalThis as { window?: MockWindow }).window = previousWindow;
  }
}

function createMockWindow(): MockWindow {
  const values = new Map<string, string>();
  return {
    name: "",
    sessionStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        values.set(key, value);
      },
    },
  };
}

function main() {
  const unset = (globalThis as { window?: unknown }).window;
  const hadNoWindow = unset === undefined;
  try {
    delete (globalThis as { window?: unknown }).window;
    assert.equal(isDiagnosticsExportedThisSession(), false);
  } finally {
    if (hadNoWindow) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window?: unknown }).window = unset;
    }
  }

  const windowState = createMockWindow();
  withMockWindow(windowState, () => {
    assert.equal(isDiagnosticsExportedThisSession(), false);
    markDiagnosticsExportedThisSession();
    assert.equal(isDiagnosticsExportedThisSession(), true);
    assert.equal(
      windowState.name.includes("__skill_workshop_first_run_diagnostics_exported__"),
      true,
    );
  });

  const viaNameWindow = createMockWindow();
  withMockWindow(viaNameWindow, () => {
    viaNameWindow.name = "prefix __skill_workshop_first_run_diagnostics_exported__ suffix";
    assert.equal(isDiagnosticsExportedThisSession(), true);
  });
}

main();
