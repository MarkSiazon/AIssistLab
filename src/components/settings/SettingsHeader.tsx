"use client";

import type { Ref } from "react";
import { displaySettingsPath } from "@/lib/ui/settings-path-display";

interface SettingsHeaderProps {
  settingsPath?: string | null;
  runtimeApplied: boolean;
  settingsDirty: boolean;
  saving: boolean;
  fileInputRef: Ref<HTMLInputElement>;
  onFileImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenImport: () => void;
  onSave: () => void;
}

export function SettingsHeader({
  settingsPath,
  runtimeApplied,
  settingsDirty,
  saving,
  fileInputRef,
  onFileImport,
  onOpenImport,
  onSave,
}: SettingsHeaderProps) {
  return (
    <div
      className="px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="min-w-0 flex flex-wrap items-center gap-2">
        <h1 className="m-0 text-sm font-semibold">Settings</h1>
        <span
          className="text-xs font-mono truncate"
          title={settingsPath ? displaySettingsPath(settingsPath) : undefined}
          style={{ color: "var(--text-muted)" }}
        >
          {displaySettingsPath(settingsPath ?? undefined)}
        </span>
        {runtimeApplied && (
          <span className="ui-status-pill">
            <span
              className="ui-status-dot"
              style={{ background: "var(--green)" }}
            />
            Applied for this session
          </span>
        )}
        {settingsDirty && (
          <span
            className="ui-status-pill settings-unsaved-pill"
            role="status"
            aria-live="polite"
          >
            <span
              className="ui-status-dot"
              style={{ background: "var(--yellow)" }}
            />
            Unsaved changes
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".env,.env.local,.env.example,text/plain"
          aria-label="Import environment file"
          onChange={onFileImport}
          style={{ display: "none" }}
        />
        <button
          type="button"
          onClick={onOpenImport}
          className="ui-button ui-button-secondary text-xs"
        >
          Import .env file
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          aria-label={settingsDirty ? "Save settings changes" : "Save settings"}
          className="ui-button ui-button-primary text-xs"
        >
          {saving ? "Saving..." : settingsDirty ? "Save Changes" : "Save"}
        </button>
      </div>
    </div>
  );
}
