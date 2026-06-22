import type { SettingsConfigField } from "@/lib/ui/settings-active-values-panel";
import { settingsFieldId } from "@/lib/ui/settings-field-ids";
import type { SettingsPathState } from "@/lib/ui/settings-status";

export interface SettingsConfigSection {
  title: string;
  fields: readonly SettingsConfigField[];
}

export interface SettingsConfigFieldRow {
  field: SettingsConfigField;
  fieldId: string;
  hintId: string;
  labelHtmlFor: string | undefined;
  pathState: SettingsPathState;
  showPathBadge: boolean;
}

export interface SettingsConfigSectionRows {
  title: string;
  fields: SettingsConfigFieldRow[];
}

function fieldUsesDetachedInput(field: SettingsConfigField): boolean {
  return field.type === "path" || field.type === "relpath";
}

function fieldShowsPathBadge(field: SettingsConfigField): boolean {
  return (
    field.type === "path" ||
    field.type === "profile" ||
    field.type === "relpath"
  );
}

export function getSettingsConfigSectionRows({
  sections,
  pathStates,
}: {
  sections: readonly SettingsConfigSection[];
  pathStates: Record<string, SettingsPathState | undefined>;
}): SettingsConfigSectionRows[] {
  return sections.map((section) => ({
    title: section.title,
    fields: section.fields.map((field) => {
      const fieldId = settingsFieldId(field.key);

      return {
        field,
        fieldId,
        hintId: `${fieldId}-hint`,
        labelHtmlFor: fieldUsesDetachedInput(field) ? undefined : fieldId,
        pathState: pathStates[field.key] ?? "idle",
        showPathBadge: fieldShowsPathBadge(field),
      };
    }),
  }));
}
