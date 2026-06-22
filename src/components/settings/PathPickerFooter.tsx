interface PathPickerFooterProps {
  selectedId: string;
  selectedPath: string;
  onClose: () => void;
  onChoosePath: (path: string) => void;
}

export function PathPickerFooter({
  selectedId,
  selectedPath,
  onClose,
  onChoosePath,
}: PathPickerFooterProps) {
  return (
    <div className="path-picker-footer">
      <div
        id={selectedId}
        className="path-picker-selected"
        aria-live="polite"
        title={selectedPath || "Select a folder"}
      >
        {selectedPath || "Select a folder"}
      </div>
      <div className="path-picker-footer-actions">
        <button
          type="button"
          onClick={onClose}
          className="ui-button ui-button-secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onChoosePath(selectedPath)}
          disabled={!selectedPath}
          className="ui-button ui-button-primary"
        >
          Select folder
        </button>
      </div>
    </div>
  );
}
