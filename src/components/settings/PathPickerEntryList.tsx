import type { Ref } from "react";
import type { BrowseEntry } from "@/lib/ui/path-picker-model";

interface PathPickerEntryListProps {
  loading: boolean;
  currentEntries: BrowseEntry[] | null;
  currentIsRoot: boolean;
  listRef: Ref<HTMLDivElement>;
  onBrowse: (path: string) => void;
  onChoosePath: (path: string) => void;
}

export function PathPickerEntryList({
  loading,
  currentEntries,
  currentIsRoot,
  listRef,
  onBrowse,
  onChoosePath,
}: PathPickerEntryListProps) {
  return (
    <div ref={listRef} className="path-picker-list">
      {loading ? (
        <div
          className="flex items-center justify-center h-full text-xs"
          role="status"
          style={{ color: "var(--text-muted)" }}
        >
          Loading...
        </div>
      ) : currentEntries?.length === 0 ? (
        <div className="flex items-center justify-center h-full text-xs flex-col gap-2">
          <span style={{ color: "var(--text-muted)" }}>No subfolders</span>
          {!currentIsRoot && (
            <span
              className="ui-status-pill"
              style={{
                background: "var(--surface-2)",
                color: "var(--green)",
              }}
            >
              This folder can be selected
            </span>
          )}
        </div>
      ) : (
        currentEntries?.map((entry) => (
          <button
            type="button"
            key={entry.fullPath}
            onClick={() => onBrowse(entry.fullPath)}
            onDoubleClick={() => onChoosePath(entry.fullPath)}
            className="path-picker-entry"
            title={entry.fullPath}
          >
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {entry.type === "drive" ? "Drive" : "Folder"}
            </span>
            <span className="text-sm truncate">{entry.name}</span>
            <span
              className="text-xs text-right"
              style={{ color: "var(--text-muted)" }}
            >
              Open
            </span>
          </button>
        ))
      )}
    </div>
  );
}
