"use client";

import type { Ref } from "react";
import type { PathPickerNotice } from "@/lib/ui/path-picker-model";

interface PathPickerControlProps {
  value: string;
  label: string;
  typedInputId: string;
  typedInputHelpId: string;
  describedBy?: string;
  controlFeedbackId: string;
  controlNotice: PathPickerNotice | null;
  nativePicking: boolean;
  browseButtonRef: Ref<HTMLButtonElement>;
  onChange: (value: string) => void;
  onUseTypedPath: () => void;
  onOpenNativePicker: () => void;
  onOpenPicker: () => void;
}

export function PathPickerControl({
  value,
  label,
  typedInputId,
  typedInputHelpId,
  describedBy,
  controlFeedbackId,
  controlNotice,
  nativePicking,
  browseButtonRef,
  onChange,
  onUseTypedPath,
  onOpenNativePicker,
  onOpenPicker,
}: PathPickerControlProps) {
  return (
    <div className="path-picker-control">
      <input
        id={typedInputId}
        aria-label={label}
        aria-describedby={`${typedInputHelpId}${
          describedBy ? ` ${describedBy}` : ""
        }${controlNotice ? ` ${controlFeedbackId}` : ""}`}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="path-picker-control-input text-sm px-3 py-2 rounded border outline-none font-mono"
        style={{
          background: "var(--surface-2)",
          borderColor: "var(--border)",
          color: "var(--text)",
          minWidth: 0,
        }}
        spellCheck={false}
        placeholder="C:\\path\\to\\folder"
      />
      <span id={typedInputHelpId} className="sr-only">
        Type or paste a folder path, then use the buttons to validate or browse.
      </span>
      <div className="path-picker-control-actions">
        <button
          type="button"
          onClick={onUseTypedPath}
          disabled={!value.trim() || nativePicking}
          title="Use typed folder path"
          className="ui-button ui-button-secondary"
        >
          Use typed
        </button>
        <button
          type="button"
          onClick={onOpenNativePicker}
          disabled={nativePicking}
          title="Open native Windows folder picker"
          className="ui-button ui-button-secondary"
        >
          {nativePicking ? "Opening..." : "Choose folder"}
        </button>
        <button
          type="button"
          onClick={onOpenPicker}
          disabled={nativePicking}
          ref={browseButtonRef}
          title="Browse folders"
          className="ui-button ui-button-secondary"
        >
          Browse app
        </button>
      </div>
      {controlNotice && (
        <div
          id={controlFeedbackId}
          className={`path-picker-control-feedback path-picker-control-feedback-${controlNotice.tone}`}
          role={controlNotice.tone === "error" ? "alert" : "status"}
          aria-live={controlNotice.tone === "error" ? "assertive" : "polite"}
        >
          {controlNotice.message}
        </div>
      )}
    </div>
  );
}
