import { getSettingsRawEnvPanelModel } from "@/lib/ui/settings-raw-env-panel";

interface RawEnvPanelProps {
  rawText: string;
  onChange: (value: string) => void;
  onImport: () => void;
}

export function RawEnvPanel({ rawText, onChange, onImport }: RawEnvPanelProps) {
  const model = getSettingsRawEnvPanelModel();

  return (
    <div className="settings-raw-pane">
      <div
        className="px-6 py-2 border-b text-xs flex flex-wrap items-center gap-3"
        style={{
          borderColor: "var(--border)",
          color: "var(--text-muted)",
          background: "var(--surface)",
        }}
      >
        <div className="settings-raw-copy">
          <label htmlFor={model.textareaId} className="settings-form-label">
            {model.label}
          </label>
          <div id={model.helpId} className="settings-form-help">
            {model.helpText}
          </div>
        </div>
        <button
          type="button"
          onClick={onImport}
          className="ui-button ui-button-secondary text-xs"
        >
          Import file
        </button>
      </div>
      <textarea
        id={model.textareaId}
        value={rawText}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={model.helpId}
        className="flex-1 p-6 text-sm outline-none resize-none"
        style={{
          background: "var(--bg)",
          color: "var(--text)",
          fontFamily: "ui-monospace, monospace",
          lineHeight: 1.7,
          border: "none",
        }}
        spellCheck={false}
        placeholder={model.placeholder}
      />
    </div>
  );
}
