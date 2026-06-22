"use client";

import { displaySettingsPath } from "@/lib/ui/settings-path-display";

export function SettingsConfigFilePanel({
  settingsPath,
}: {
  settingsPath?: string | null;
}) {
  return (
    <div className="p-4">
      <div
        className="text-xs font-medium mb-1"
        style={{ color: "var(--text-muted)" }}
      >
        Config file
      </div>
      <div
        className="text-xs font-mono break-all"
        style={{ color: "var(--text-muted)", lineHeight: 1.5 }}
      >
        {displaySettingsPath(settingsPath ?? undefined)}
      </div>
    </div>
  );
}
