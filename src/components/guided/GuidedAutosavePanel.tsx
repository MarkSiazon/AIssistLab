interface GuidedAutosavePanelProps {
  message: string;
  canClear: boolean;
  confirmOpen: boolean;
  onRequestClear: () => void;
  onCancelClear: () => void;
  onConfirmClear: () => void;
}

export function GuidedAutosavePanel({
  message,
  canClear,
  confirmOpen,
  onRequestClear,
  onCancelClear,
  onConfirmClear,
}: GuidedAutosavePanelProps) {
  return (
    <div className="guided-autosave-panel">
      <div className="guided-autosave-copy">
        <div className="guided-autosave-label">Draft autosave</div>
        <div className="guided-autosave-message" role="status" aria-live="polite">
          {message}
        </div>
      </div>
      <button
        type="button"
        onClick={onRequestClear}
        disabled={!canClear}
        aria-expanded={confirmOpen}
        aria-controls="guided-clear-confirmation"
        className="guided-autosave-clear"
      >
        Clear draft
      </button>
      {confirmOpen && (
        <div
          id="guided-clear-confirmation"
          className="guided-autosave-confirm"
          role="group"
          aria-label="Confirm clear guided draft"
        >
          <div className="guided-autosave-confirm-copy">
            This clears the guided draft from this browser tab.
          </div>
          <div className="guided-autosave-confirm-actions">
            <button
              type="button"
              onClick={onCancelClear}
              className="guided-autosave-confirm-cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirmClear}
              className="guided-autosave-confirm-delete"
            >
              Clear draft
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
