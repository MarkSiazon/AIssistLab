"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useDialogFocusTrap } from "@/hooks/useDialogFocusTrap";
import { usePathPickerBrowse } from "@/hooks/usePathPickerBrowse";

interface PathPickerControllerInput {
  value: string;
  onChange: (path: string) => void;
  label: string;
  browseFrom?: string;
  inputId?: string;
  describedBy?: string;
}

export function usePathPickerController({
  value,
  onChange,
  label,
  browseFrom,
  inputId,
  describedBy,
}: PathPickerControllerInput) {
  const pickerId = useId();
  const [open, setOpen] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const browseButtonRef = useRef<HTMLButtonElement>(null);

  const pathBrowser = usePathPickerBrowse({
    value,
    onChange,
    label,
    browseFrom,
    listRef,
    onSelectedPath: () => setOpen(false),
  });

  const close = useCallback(() => {
    setOpen(false);
    pathBrowser.cancelBrowse();
    pathBrowser.clearError();
  }, [pathBrowser]);

  const { rememberFocus, trapTabKey } = useDialogFocusTrap({
    open,
    dialogRef,
    initialFocusRef: addressInputRef,
    fallbackFocusRef: browseButtonRef,
  });

  const openPicker = useCallback(() => {
    if (pathBrowser.nativePicking) return;

    rememberFocus();
    pathBrowser.setControlNotice(null);
    setOpen(true);
    pathBrowser.browse(browseFrom || value || "");
  }, [browseFrom, pathBrowser, rememberFocus, value]);

  function handleBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).dataset.backdrop) close();
  }

  function handleDialogKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    trapTabKey(event);
  }

  return {
    controlProps: {
      value,
      label,
      typedInputId: inputId ?? `${pickerId}-typed-path`,
      typedInputHelpId: `${pickerId}-typed-path-help`,
      describedBy,
      controlFeedbackId: `${pickerId}-control-feedback`,
      controlNotice: pathBrowser.controlNotice,
      nativePicking: pathBrowser.nativePicking,
      browseButtonRef,
      onChange: (nextValue: string) => {
        pathBrowser.setControlNotice(null);
        onChange(nextValue);
      },
      onUseTypedPath: pathBrowser.useTypedPath,
      onOpenNativePicker: pathBrowser.openNativePicker,
      onOpenPicker: openPicker,
    },
    dialogProps: {
      label,
      titleId: `${pickerId}-title`,
      descriptionId: `${pickerId}-description`,
      errorId: `${pickerId}-error`,
      selectedId: `${pickerId}-selected`,
      error: pathBrowser.error,
      address: pathBrowser.address,
      crumbs: pathBrowser.crumbs,
      loading: pathBrowser.loading,
      currentEntries: pathBrowser.currentEntries,
      currentIsRoot: pathBrowser.currentIsRoot,
      selectedPath: pathBrowser.selectedPath,
      browseFrom,
      value,
      recent: pathBrowser.recent,
      dialogRef,
      addressInputRef,
      listRef,
      onBackdropClick: handleBackdropClick,
      onDialogKeyDown: handleDialogKeyDown,
      onClose: close,
      onBrowse: pathBrowser.browse,
      onGoParent: pathBrowser.goParent,
      onAddressChange: pathBrowser.setAddress,
      onAddressSubmit: pathBrowser.handleAddressSubmit,
      onChoosePath: pathBrowser.choosePath,
    },
    open,
  };
}
