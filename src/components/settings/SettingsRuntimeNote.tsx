"use client";

export function SettingsRuntimeNote({
  settingsDirty,
}: {
  settingsDirty: boolean;
}) {
  return (
    <div
      className="px-6 py-2 border-b flex flex-wrap items-center gap-2"
      style={{
        borderColor: "var(--border)",
        background: settingsDirty
          ? "rgba(210, 153, 34, 0.12)"
          : "rgba(210, 153, 34, 0.08)",
      }}
    >
      <span className="ui-status-dot" style={{ background: "var(--yellow)" }} />
      <span
        className="text-xs"
        style={{ color: "var(--yellow)", opacity: 0.9 }}
      >
        {settingsDirty
          ? "Unsaved changes are local to this page. Save to apply provider values to this session and persist .env.local."
          : "Provider settings apply to this server session when saved. Workspace and skills path changes may still need a rebuild or server restart."}
      </span>
    </div>
  );
}
