import type { ExportSelectionToolbarState } from "@/lib/ui/export-selection-toolbar";

interface ExportSelectionToolbarProps {
  selectedCount: number;
  skillCount: number;
  includeDiagnostics: boolean;
  toolbar: ExportSelectionToolbarState;
  onIncludeDiagnosticsChange: (value: boolean) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onDownloadSelected: () => void;
}

export function ExportSelectionToolbar({
  selectedCount,
  skillCount,
  includeDiagnostics,
  toolbar,
  onIncludeDiagnosticsChange,
  onSelectAll,
  onSelectNone,
  onDownloadSelected,
}: ExportSelectionToolbarProps) {
  return (
    <section className="export-toolbar" aria-label="Export selection controls">
      <div className="export-toolbar-copy">
        <span className="export-selection-count">
          {selectedCount > 0 ? (
            <>
              <strong>{selectedCount}</strong> of {skillCount} selected
            </>
          ) : (
            toolbar.selectionLabel
          )}
        </span>
        <span className="export-toolbar-hint">{toolbar.hint}</span>
      </div>
      <label className="export-diagnostics-toggle">
        <input
          type="checkbox"
          checked={includeDiagnostics}
          aria-label="Include diagnostics in export bundle"
          onChange={(event) =>
            onIncludeDiagnosticsChange(event.target.checked)
          }
          className="export-checkbox"
        />
        <span>Include diagnostics</span>
        <span className="export-diagnostics-toggle-hint">
          Applies to skill bundle downloads
        </span>
      </label>
      <div className="export-toolbar-actions">
        <button
          type="button"
          onClick={onSelectAll}
          disabled={toolbar.selectAllDisabled}
          className="ui-button ui-button-subtle text-xs"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={onSelectNone}
          disabled={toolbar.clearDisabled}
          className="ui-button ui-button-subtle text-xs"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onDownloadSelected}
          disabled={toolbar.selectedDownloadDisabled}
          className="ui-button ui-button-secondary text-xs"
          aria-label={toolbar.selectedDownloadAriaLabel}
        >
          {toolbar.selectedDownloadLabel}
        </button>
      </div>
    </section>
  );
}
