import { getSettingsExtraFieldRows } from "@/lib/ui/settings-extra-fields-panel";

interface ExtraFieldsPanelProps {
  extraFields: Record<string, string>;
  onAdd: () => void;
  onUpdate: (oldKey: string, nextKey: string, nextValue: string) => void;
  onRemove: (key: string) => void;
}

export function ExtraFieldsPanel({
  extraFields,
  onAdd,
  onUpdate,
  onRemove,
}: ExtraFieldsPanelProps) {
  const rows = getSettingsExtraFieldRows({ extraFields });

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Additional Variables
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="ui-button ui-button-subtle text-xs"
        >
          + Add
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.index} className="settings-extra-row">
            <label htmlFor={row.keyInputId} className="settings-form-label">
              Variable key
            </label>
            <input
              id={row.keyInputId}
              type="text"
              value={row.key}
              onChange={(event) =>
                onUpdate(row.key, event.target.value, row.value)
              }
              placeholder="KEY"
              className="settings-extra-key text-xs px-2 py-1.5 rounded border outline-none font-mono"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
            <span
              className="settings-extra-equals"
              aria-hidden="true"
              style={{ color: "var(--text-muted)" }}
            >
              =
            </span>
            <label htmlFor={row.valueInputId} className="settings-form-label">
              Value
            </label>
            <input
              id={row.valueInputId}
              type="text"
              value={row.value}
              onChange={(event) => onUpdate(row.key, row.key, event.target.value)}
              placeholder="value"
              className="settings-extra-value text-xs px-2 py-1.5 rounded border outline-none font-mono"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
            <button
              type="button"
              aria-label={row.removeLabel}
              onClick={() => onRemove(row.key)}
              className="ui-button ui-button-subtle text-xs"
              style={{ color: "var(--red)" }}
            >
              x
            </button>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            No additional variables. Click + Add to define custom ones.
          </div>
        )}
      </div>
    </section>
  );
}
