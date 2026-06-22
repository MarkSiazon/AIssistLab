"use client";

export interface SettingsStatusMessage {
  type: "success" | "error";
  msg: string;
}

interface SettingsStatusBannerProps {
  status: SettingsStatusMessage | null;
  onDismiss: () => void;
}

export function SettingsStatusBanner({
  status,
  onDismiss,
}: SettingsStatusBannerProps) {
  if (!status) return null;

  const toneColor = status.type === "success" ? "var(--green)" : "var(--red)";

  return (
    <div
      className="px-6 py-2 border-b flex flex-wrap items-center justify-between gap-3"
      role="status"
      aria-live="polite"
      style={{
        borderColor: "var(--border)",
        background:
          status.type === "success"
            ? "rgba(63, 185, 80, 0.08)"
            : "rgba(248, 81, 73, 0.08)",
      }}
    >
      <span className="text-xs flex items-center gap-2" style={{ color: toneColor }}>
        <span className="ui-status-dot" style={{ background: toneColor }} />
        {status.msg}
      </span>
      <button
        type="button"
        onClick={onDismiss}
        className="ui-button ui-button-subtle text-xs"
        aria-label="Dismiss status message"
      >
        Dismiss
      </button>
    </div>
  );
}
