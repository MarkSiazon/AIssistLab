import type { ReactNode } from "react";
import { PathPicker } from "@/components/settings/PathPicker";
import type { SettingsConfigField } from "@/lib/ui/settings-active-values-panel";
import {
  getPasswordFieldState,
  getRelativePathFieldState,
  getSelectFieldValue,
} from "@/lib/ui/settings-field-controls";
import type { SettingsPathState } from "@/lib/ui/settings-status";

interface BaseFieldControlProps {
  field: SettingsConfigField;
  fieldId: string;
  hintId: string;
  value: string;
  onChange: (value: string) => void;
}

interface PathFieldControlProps extends BaseFieldControlProps {
  pathState: SettingsPathState;
  renderPathBadge: (state: SettingsPathState) => ReactNode;
}

interface RelativePathFieldControlProps extends PathFieldControlProps {
  workspaceRoot: string;
  toRelative: (absolutePath: string, workspaceRoot: string) => string;
}

interface PasswordFieldControlProps extends BaseFieldControlProps {
  visible: boolean;
  onToggleVisible: () => void;
}

export function SettingsPathFieldControl({
  field,
  fieldId,
  hintId,
  value,
  pathState,
  renderPathBadge,
  onChange,
}: PathFieldControlProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <PathPicker
        value={value}
        onChange={onChange}
        label={`Select ${field.label}`}
        inputId={fieldId}
        describedBy={hintId}
      />
      {renderPathBadge(pathState)}
    </div>
  );
}

export function SettingsRelativePathFieldControl({
  field,
  fieldId,
  hintId,
  value,
  pathState,
  workspaceRoot,
  toRelative,
  renderPathBadge,
  onChange,
}: RelativePathFieldControlProps) {
  const relativeState = getRelativePathFieldState({
    value,
    workspaceRoot,
  });

  return (
    <div className="flex flex-col gap-1.5">
      <PathPicker
        value={value}
        browseFrom={relativeState.browseFrom}
        onChange={(absolutePath) =>
          onChange(
            workspaceRoot
              ? toRelative(absolutePath, workspaceRoot)
              : absolutePath,
          )
        }
        label={`Select ${field.label}`}
        inputId={fieldId}
        describedBy={hintId}
      />
      {renderPathBadge(pathState)}
      {relativeState.resolvedPath && (
        <div
          className="text-xs font-mono px-1 truncate"
          style={{ color: "var(--text-muted)" }}
        >
          Resolves to: {relativeState.resolvedPath}
        </div>
      )}
    </div>
  );
}

export function SettingsSelectFieldControl({
  field,
  fieldId,
  hintId,
  value,
  onChange,
}: BaseFieldControlProps) {
  return (
    <select
      id={fieldId}
      value={getSelectFieldValue({
        value,
        defaultValue: field.defaultValue,
        placeholder: field.placeholder,
      })}
      onChange={(event) => onChange(event.target.value)}
      aria-describedby={hintId}
      className="w-full text-sm px-3 py-2 rounded border outline-none"
      style={{
        background: "var(--surface-2)",
        borderColor: "var(--border)",
        color: "var(--text)",
      }}
    >
      {field.options?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function SettingsPasswordFieldControl({
  field,
  fieldId,
  hintId,
  value,
  visible,
  onChange,
  onToggleVisible,
}: PasswordFieldControlProps) {
  const passwordState = getPasswordFieldState({
    visible,
    label: field.label,
  });

  return (
    <div className="relative">
      <input
        id={fieldId}
        type={passwordState.inputType}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        aria-describedby={hintId}
        className="w-full text-sm px-3 py-2 rounded border outline-none font-mono"
        style={{
          background: "var(--surface-2)",
          borderColor: "var(--border)",
          color: "var(--text)",
          paddingRight: "3.5rem",
        }}
        spellCheck={false}
      />
      <button
        type="button"
        onClick={onToggleVisible}
        className="settings-password-toggle ui-button ui-button-subtle text-xs"
        aria-label={passwordState.toggleAriaLabel}
      >
        {passwordState.toggleLabel}
      </button>
    </div>
  );
}

export function SettingsTextFieldControl({
  field,
  fieldId,
  hintId,
  value,
  onChange,
}: BaseFieldControlProps) {
  return (
    <input
      id={fieldId}
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.placeholder}
      aria-describedby={hintId}
      className="w-full text-sm px-3 py-2 rounded border outline-none"
      style={{
        background: "var(--surface-2)",
        borderColor: "var(--border)",
        color: "var(--text)",
      }}
      spellCheck={false}
    />
  );
}
