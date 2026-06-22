import type { ReactNode } from "react";
import type { SettingsConfigField } from "@/lib/ui/settings-active-values-panel";
import {
  getSettingsConfigSectionRows,
  type SettingsConfigSection,
} from "@/lib/ui/settings-config-fields-panel";
import type { SettingsPathState } from "@/lib/ui/settings-status";

interface ConfigFieldsPanelProps {
  sections: readonly SettingsConfigSection[];
  pathStates: Record<string, SettingsPathState | undefined>;
  renderField: (field: SettingsConfigField) => ReactNode;
  renderPathBadge: (state: SettingsPathState) => ReactNode;
}

export function ConfigFieldsPanel({
  sections,
  pathStates,
  renderField,
  renderPathBadge,
}: ConfigFieldsPanelProps) {
  const sectionRows = getSettingsConfigSectionRows({ sections, pathStates });

  return (
    <>
      {sectionRows.map((section) => (
        <section key={section.title}>
          <div
            className="text-xs font-semibold mb-4 uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            {section.title}
          </div>
          <div className="flex flex-col gap-5">
            {section.fields.map((row) => (
              <div key={row.field.key}>
                <label
                  htmlFor={row.labelHtmlFor}
                  className="text-xs font-medium flex items-center gap-2 mb-1.5"
                >
                  <span style={{ color: "var(--text)" }}>
                    {row.field.label}
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      color: "var(--text-muted)",
                      fontWeight: 400,
                    }}
                  >
                    {row.field.key}
                  </span>
                  {row.showPathBadge && renderPathBadge(row.pathState)}
                </label>
                {renderField(row.field)}
                <div
                  id={row.hintId}
                  className="text-xs mt-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {row.field.hint}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
