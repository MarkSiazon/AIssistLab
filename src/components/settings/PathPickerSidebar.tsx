import { compactPath } from "@/lib/ui/path-picker-model";

interface PathPickerSidebarProps {
  browseFrom?: string;
  value: string;
  recent: string[];
  loading: boolean;
  onBrowse: (path: string) => void;
}

export function PathPickerSidebar({
  browseFrom,
  value,
  recent,
  loading,
  onBrowse,
}: PathPickerSidebarProps) {
  return (
    <aside className="path-picker-sidebar" aria-label="Folder shortcuts">
      <button
        type="button"
        onClick={() => onBrowse("")}
        disabled={loading}
        className="ui-button ui-button-secondary"
      >
        This PC
      </button>
      {browseFrom && (
        <button
          type="button"
          onClick={() => onBrowse(browseFrom)}
          disabled={loading}
          className="ui-button ui-button-secondary"
          title={browseFrom}
        >
          Start folder
        </button>
      )}
      {value && (
        <button
          type="button"
          onClick={() => onBrowse(value)}
          disabled={loading}
          className="ui-button ui-button-secondary"
          title={value}
        >
          Current value
        </button>
      )}
      {recent.length > 0 && (
        <>
          <div
            className="path-picker-recent-label text-xs mt-2"
            style={{ color: "var(--text-muted)" }}
          >
            Recent
          </div>
          {recent.map((pathValue) => (
            <button
              type="button"
              key={pathValue}
              onClick={() => onBrowse(pathValue)}
              disabled={loading}
              className="ui-button ui-button-secondary font-mono"
              title={pathValue}
            >
              {compactPath(pathValue)}
            </button>
          ))}
        </>
      )}
    </aside>
  );
}
