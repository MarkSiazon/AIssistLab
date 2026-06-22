import type { SettingsActiveValueItem } from "@/lib/ui/settings-active-values-panel";

interface ActiveValuesPanelProps {
  items: SettingsActiveValueItem[];
}

export function ActiveValuesPanel({ items }: ActiveValuesPanelProps) {
  return (
    <section
      className="settings-active-values-panel"
      aria-labelledby="settings-active-values-title"
    >
      <div className="settings-active-values-header">
        <h2
          id="settings-active-values-title"
          className="settings-active-values-title"
        >
          Active Values
        </h2>
        <div className="settings-active-values-subtitle">
          Sanitized display of saved provider and workspace inputs
        </div>
      </div>
      <div className="settings-active-values-list">
        {items.map((item) => (
          <div
            key={item.key}
            className={`settings-active-value-row settings-active-value-row-${item.tone}`}
          >
            <div className="settings-active-value-head">
              <div className="settings-active-value-label">
                <span className="settings-active-value-key">{item.key}</span>
                <span className="settings-active-value-name">
                  {item.label}
                </span>
              </div>
              <span className="settings-active-value-status">
                {item.statusLabel}
              </span>
            </div>
            <div className="settings-active-value-text" title={item.title}>
              {item.displayValue}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
