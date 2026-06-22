import {
  getSettingsWorkspaceProfileRows,
  type SettingsWorkspaceProfile,
} from "@/lib/ui/settings-workspace-profiles-panel";

interface WorkspaceProfilesPanelProps {
  profileName: string;
  profiles: SettingsWorkspaceProfile[];
  formatPath: (value: string) => string;
  onProfileNameChange: (value: string) => void;
  onSaveCurrent: () => void;
  onApply: (profile: SettingsWorkspaceProfile) => void;
  onDelete: (profileId: string) => void;
}

export function WorkspaceProfilesPanel({
  profileName,
  profiles,
  formatPath,
  onProfileNameChange,
  onSaveCurrent,
  onApply,
  onDelete,
}: WorkspaceProfilesPanelProps) {
  const rows = getSettingsWorkspaceProfileRows({ profiles, formatPath });
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

  return (
    <section>
      <div
        className="text-xs font-semibold mb-4 uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        Workspace Profiles
      </div>
      <div
        className="rounded border p-4 flex flex-col gap-3"
        style={{
          borderColor: "var(--border)",
          background: "var(--surface)",
        }}
      >
        <div className="settings-inline-field">
          <label
            htmlFor="settings-workspace-profile-name"
            className="settings-form-label"
          >
            Profile name
          </label>
          <input
            id="settings-workspace-profile-name"
            value={profileName}
            onChange={(event) => onProfileNameChange(event.target.value)}
            placeholder="Local project"
            aria-describedby="settings-workspace-profile-help"
            className="settings-inline-field-input text-sm px-3 py-2 rounded border outline-none"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
              color: "var(--text)",
              minHeight: "44px",
            }}
          />
          <div
            id="settings-workspace-profile-help"
            className="settings-form-help"
          >
            Save the current workspace and skills paths for quick reuse.
          </div>
          <button
            type="button"
            onClick={onSaveCurrent}
            className="ui-button ui-button-secondary text-xs"
          >
            Save Current
          </button>
        </div>
        {rows.length > 0 ? (
          <div className="flex flex-col gap-2">
            {rows.map((row) => {
              const profile = profilesById.get(row.id);
              if (!profile) return null;

              return (
                <div
                  key={row.id}
                  className="rounded border p-2 flex items-center gap-2"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium">{row.name}</div>
                    <div
                      className="text-[10px] font-mono truncate"
                      title={row.title}
                      style={{ color: "var(--text-muted)" }}
                    >
                      {row.workspaceDisplay || "(no root)"} /{" "}
                      {row.skillsDirDisplay || "(no skills dir)"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onApply(profile)}
                    className="ui-button ui-button-primary text-xs"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(row.id)}
                    className="ui-button ui-button-subtle text-xs"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Save common workspace path pairs here, then apply them without
            opening the raw env editor.
          </div>
        )}
      </div>
    </section>
  );
}
