import {
  getSettingsDataBoundaryPanelModel,
  settingsDataBoundaryToneClassName,
} from "@/lib/ui/settings-data-boundary-panel";

export function DataBoundaryPanel() {
  const model = getSettingsDataBoundaryPanelModel();

  return (
    <section
      className="settings-data-boundary-panel"
      aria-labelledby="settings-data-boundary-title"
    >
      <div className="settings-data-boundary-header">
        <h2 id="settings-data-boundary-title" className="settings-data-boundary-title">
          {model.title}
        </h2>
        <p className="settings-data-boundary-subtitle">{model.subtitle}</p>
      </div>

      <div className="settings-data-boundary-list" role="list">
        {model.items.map((item) => (
          <div
            key={item.id}
            className="settings-data-boundary-item"
            role="listitem"
          >
            <span
              className={`settings-data-boundary-rail ${settingsDataBoundaryToneClassName(
                item.tone,
              )}`}
              aria-hidden="true"
            />
            <div className="settings-data-boundary-copy">
              <div className="settings-data-boundary-label">{item.label}</div>
              <div className="settings-data-boundary-summary">{item.summary}</div>
              <div className="settings-data-boundary-detail">{item.detail}</div>
            </div>
          </div>
        ))}
      </div>

      <p className="settings-data-boundary-footer">{model.footer}</p>
    </section>
  );
}
