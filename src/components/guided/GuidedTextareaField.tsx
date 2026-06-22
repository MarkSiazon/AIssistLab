"use client";

import { guidedFieldStyle } from "@/lib/ui/guided-builder-model";

interface GuidedTextareaFieldProps {
  field: string;
  id: string;
  label: string;
  help: string;
  value: string;
  placeholder: string;
  error?: string;
  rows?: number;
  onChange: (value: string) => void;
}

export function GuidedTextareaField({
  id,
  label,
  help,
  value,
  placeholder,
  error,
  rows = 5,
  onChange,
}: GuidedTextareaFieldProps) {
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;

  return (
    <div className="guided-field">
      <label className="guided-field-label" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="guided-textarea"
        aria-invalid={error ? "true" : "false"}
        aria-describedby={`${helpId}${error ? ` ${errorId}` : ""}`}
        style={guidedFieldStyle()}
      />
      <div id={helpId} className="guided-field-help">
        {help}
      </div>
      {error && (
        <div id={errorId} className="guided-field-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
