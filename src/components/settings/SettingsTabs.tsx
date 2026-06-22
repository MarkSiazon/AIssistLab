"use client";

export type SettingsTab = "fields" | "raw";

interface SettingsTabsProps {
  tab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export function SettingsTabs({ tab, onTabChange }: SettingsTabsProps) {
  return (
    <div
      className="flex border-b px-6"
      role="tablist"
      aria-label="Settings editor mode"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface)",
      }}
    >
      {(["fields", "raw"] as const).map((nextTab) => (
        <button
          type="button"
          key={nextTab}
          onClick={() => onTabChange(nextTab)}
          role="tab"
          aria-selected={tab === nextTab}
          className="text-xs px-4 py-2.5 border-b-2"
          style={{
            borderColor: tab === nextTab ? "var(--accent)" : "transparent",
            color: tab === nextTab ? "var(--accent)" : "var(--text-muted)",
            background: "none",
            cursor: "pointer",
          }}
        >
          {nextTab === "fields" ? "Config Fields" : "Raw .env Editor"}
        </button>
      ))}
    </div>
  );
}
