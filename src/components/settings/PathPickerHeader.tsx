interface PathPickerHeaderProps {
  label: string;
  titleId: string;
  descriptionId: string;
  onClose: () => void;
}

export function PathPickerHeader({
  label,
  titleId,
  descriptionId,
  onClose,
}: PathPickerHeaderProps) {
  return (
    <div className="path-picker-header">
      <div>
        <div id={titleId} className="text-sm font-semibold">
          {label}
        </div>
        <div
          id={descriptionId}
          className="text-xs mt-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          Choose a local folder path
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        title="Close"
        className="ui-button ui-button-subtle"
      >
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          className="path-picker-close-icon"
        >
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
      </button>
    </div>
  );
}
