import type { FormEvent, Ref } from "react";
import type { PathCrumb } from "@/lib/ui/path-picker-model";

interface PathPickerAddressBarProps {
  address: string;
  crumbs: PathCrumb[];
  loading: boolean;
  error: string | null;
  errorId: string;
  descriptionId: string;
  addressInputRef: Ref<HTMLInputElement>;
  onBrowse: (path: string) => void;
  onGoParent: () => void;
  onAddressChange: (value: string) => void;
  onAddressSubmit: (event: FormEvent) => void;
}

export function PathPickerAddressBar({
  address,
  crumbs,
  loading,
  error,
  errorId,
  descriptionId,
  addressInputRef,
  onBrowse,
  onGoParent,
  onAddressChange,
  onAddressSubmit,
}: PathPickerAddressBarProps) {
  return (
    <div className="path-picker-address">
      <form onSubmit={onAddressSubmit} className="path-picker-address-form">
        <button
          type="button"
          onClick={() => onBrowse("")}
          disabled={loading}
          className="ui-button ui-button-secondary"
        >
          This PC
        </button>
        <button
          type="button"
          onClick={onGoParent}
          disabled={loading}
          className="ui-button ui-button-secondary"
        >
          Up
        </button>
        <input
          ref={addressInputRef}
          aria-label="Folder path"
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errorId : descriptionId}
          value={address}
          onChange={(event) => onAddressChange(event.target.value)}
          placeholder="Type or paste a folder path"
          className="path-picker-address-input flex-1 text-xs px-3 py-1.5 rounded border outline-none font-mono"
          style={{
            background: "var(--surface-2)",
            borderColor: error ? "var(--red)" : "var(--border)",
            color: "var(--text)",
          }}
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={loading}
          className="ui-button ui-button-secondary"
        >
          Go
        </button>
      </form>

      {crumbs.length > 0 && (
        <div className="path-picker-breadcrumbs">
          <button
            type="button"
            onClick={() => onBrowse("")}
            disabled={loading}
            className="ui-button ui-button-subtle"
          >
            This PC
          </button>
          {crumbs.map((crumb, index) => (
            <span key={crumb.path} className="flex items-center gap-1">
              <span style={{ color: "var(--border)" }}>\</span>
              <button
                type="button"
                onClick={() => onBrowse(crumb.path)}
                disabled={loading}
                className="ui-button ui-button-subtle max-w-[160px] truncate"
                style={{
                  color:
                    index === crumbs.length - 1
                      ? "var(--text)"
                      : "var(--accent)",
                }}
                title={crumb.path}
              >
                {crumb.label}
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
