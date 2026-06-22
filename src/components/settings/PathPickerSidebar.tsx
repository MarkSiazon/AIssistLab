import { compactPath, isAbsolutePathValue } from "@/lib/ui/path-picker-model";

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
  const currentValuePath =
    value && browseFrom && !isAbsolutePathValue(value) ? browseFrom : value;
  const showCurrentValue =
    currentValuePath && currentValuePath.toLowerCase() !== browseFrom?.toLowerCase();

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
      {showCurrentValue && (
        <button
          type="button"
          onClick={() => onBrowse(currentValuePath)}
          disabled={loading}
          className="ui-button ui-button-secondary"
          title={currentValuePath}
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
