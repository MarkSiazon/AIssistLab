"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
  type RefObject,
} from "react";

interface UseDialogFocusTrapInput<
  TInitial extends HTMLElement,
  TFallback extends HTMLElement,
> {
  open: boolean;
  dialogRef: RefObject<HTMLDivElement | null>;
  initialFocusRef: RefObject<TInitial | null>;
  fallbackFocusRef?: RefObject<TFallback | null>;
}

function focusableDialogElements(dialog: HTMLDivElement): HTMLElement[] {
  return Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.offsetParent !== null);
}

export function useDialogFocusTrap<
  TInitial extends HTMLElement,
  TFallback extends HTMLElement,
>({
  open,
  dialogRef,
  initialFocusRef,
  fallbackFocusRef,
}: UseDialogFocusTrapInput<TInitial, TFallback>) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const rememberFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
  }, []);

  const trapTabKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = focusableDialogElements(dialogRef.current);

      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (
        event.shiftKey &&
        (active === first || !dialogRef.current.contains(active))
      ) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [dialogRef],
  );

  useEffect(() => {
    if (!open) return;

    const fallbackFocus = fallbackFocusRef?.current ?? null;
    const previousFocus = previousFocusRef.current;
    const timer = window.setTimeout(() => {
      initialFocusRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      const target = previousFocus ?? fallbackFocus;
      if (target && typeof target.focus === "function") {
        target.focus();
      }
    };
  }, [fallbackFocusRef, initialFocusRef, open]);

  return {
    rememberFocus,
    trapTabKey,
  };
}
