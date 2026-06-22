"use client";

import type { FormEvent, KeyboardEvent, MouseEvent, Ref } from "react";
import { PathPickerAddressBar } from "@/components/settings/PathPickerAddressBar";
import { PathPickerEntryList } from "@/components/settings/PathPickerEntryList";
import { PathPickerFooter } from "@/components/settings/PathPickerFooter";
import { PathPickerHeader } from "@/components/settings/PathPickerHeader";
import { PathPickerSidebar } from "@/components/settings/PathPickerSidebar";
import type { BrowseEntry, PathCrumb } from "@/lib/ui/path-picker-model";

interface PathPickerDialogProps {
  label: string;
  titleId: string;
  descriptionId: string;
  errorId: string;
  selectedId: string;
  error: string | null;
  address: string;
  crumbs: PathCrumb[];
  loading: boolean;
  currentEntries: BrowseEntry[] | null;
  currentIsRoot: boolean;
  selectedPath: string;
  browseFrom?: string;
  value: string;
  recent: string[];
  dialogRef: Ref<HTMLDivElement>;
  addressInputRef: Ref<HTMLInputElement>;
  listRef: Ref<HTMLDivElement>;
  onBackdropClick: (event: MouseEvent) => void;
  onDialogKeyDown: (event: KeyboardEvent) => void;
  onClose: () => void;
  onBrowse: (path: string) => void;
  onGoParent: () => void;
  onAddressChange: (value: string) => void;
  onAddressSubmit: (event: FormEvent) => void;
  onChoosePath: (path: string) => void;
}

export function PathPickerDialog({
  label,
  titleId,
  descriptionId,
  errorId,
  selectedId,
  error,
  address,
  crumbs,
  loading,
  currentEntries,
  currentIsRoot,
  selectedPath,
  browseFrom,
  value,
  recent,
  dialogRef,
  addressInputRef,
  listRef,
  onBackdropClick,
  onDialogKeyDown,
  onClose,
  onBrowse,
  onGoParent,
  onAddressChange,
  onAddressSubmit,
  onChoosePath,
}: PathPickerDialogProps) {
  return (
    <div
      data-backdrop="1"
      onClick={onBackdropClick}
      onKeyDown={onDialogKeyDown}
      className="path-picker-backdrop"
    >
      <div
        ref={dialogRef}
        className="path-picker-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ""}`}
        tabIndex={-1}
      >
        <PathPickerHeader
          label={label}
          titleId={titleId}
          descriptionId={descriptionId}
          onClose={onClose}
        />

        <PathPickerAddressBar
          address={address}
          crumbs={crumbs}
          loading={loading}
          error={error}
          errorId={errorId}
          descriptionId={descriptionId}
          addressInputRef={addressInputRef}
          onBrowse={onBrowse}
          onGoParent={onGoParent}
          onAddressChange={onAddressChange}
          onAddressSubmit={onAddressSubmit}
        />

        {error && (
          <div id={errorId} className="path-picker-error" role="alert">
            {error}
          </div>
        )}

        <div className="path-picker-body">
          <PathPickerSidebar
            browseFrom={browseFrom}
            value={value}
            recent={recent}
            loading={loading}
            onBrowse={onBrowse}
          />
          <PathPickerEntryList
            loading={loading}
            currentEntries={currentEntries}
            currentIsRoot={currentIsRoot}
            listRef={listRef}
            onBrowse={onBrowse}
            onChoosePath={onChoosePath}
          />
        </div>

        <PathPickerFooter
          selectedId={selectedId}
          selectedPath={selectedPath}
          onClose={onClose}
          onChoosePath={onChoosePath}
        />
      </div>
    </div>
  );
}
