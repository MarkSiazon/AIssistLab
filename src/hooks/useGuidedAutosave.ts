"use client";

import { useEffect, useState } from "react";
import {
  buildGuidedFormSnapshot,
  guidedFormHasContent,
  parseGuidedFormSnapshot,
  type GuidedFormSnapshot,
  type GuidedFormSnapshotInput,
} from "@/lib/skills/guided-autosave";
import {
  formatGuidedAutosaveTime,
  GUIDED_FORM_STORAGE_KEY,
} from "@/lib/ui/guided-builder-model";

interface GuidedAutosaveInput {
  formSnapshotInput: GuidedFormSnapshotInput;
  formHasContent: boolean;
  onRestoreSnapshot: (snapshot: GuidedFormSnapshot) => void;
  onClearForm: () => void;
}

export function useGuidedAutosave({
  formSnapshotInput,
  formHasContent,
  onRestoreSnapshot,
  onClearForm,
}: GuidedAutosaveInput) {
  const [ready, setReady] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [message, setMessage] = useState(
    "Autosaves in this tab after you start typing.",
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    try {
      const snapshot = parseGuidedFormSnapshot(
        sessionStorage.getItem(GUIDED_FORM_STORAGE_KEY),
      );
      if (snapshot && guidedFormHasContent(snapshot)) {
        onRestoreSnapshot(snapshot);
        setHasContent(true);
        setMessage(
          `Restored draft saved at ${formatGuidedAutosaveTime(snapshot.updatedAt)}.`,
        );
      }
    } catch {
      setMessage("Autosave is unavailable in this browser session.");
    } finally {
      setReady(true);
    }
  }, [onRestoreSnapshot]);

  useEffect(() => {
    if (!ready) return undefined;

    const timer = window.setTimeout(() => {
      try {
        if (!formHasContent) {
          sessionStorage.removeItem(GUIDED_FORM_STORAGE_KEY);
          setHasContent(false);
          setMessage("Autosaves in this tab after you start typing.");
          return;
        }

        const snapshot = buildGuidedFormSnapshot(formSnapshotInput);
        sessionStorage.setItem(GUIDED_FORM_STORAGE_KEY, JSON.stringify(snapshot));
        setHasContent(true);
        setMessage(
          `Saved in this tab at ${formatGuidedAutosaveTime(snapshot.updatedAt)}.`,
        );
      } catch {
        setMessage("Autosave is unavailable in this browser session.");
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [ready, formHasContent, formSnapshotInput]);

  function requestClear() {
    if (!formHasContent && !hasContent) return;
    setConfirmOpen(true);
  }

  function confirmClear() {
    try {
      sessionStorage.removeItem(GUIDED_FORM_STORAGE_KEY);
    } catch {
      // Some embedded browser contexts restrict storage access.
    }
    onClearForm();
    setHasContent(false);
    setConfirmOpen(false);
    setMessage("Draft cleared from this tab.");
  }

  return {
    message,
    canClear: formHasContent || hasContent,
    confirmOpen,
    requestClear,
    cancelClear: () => setConfirmOpen(false),
    confirmClear,
  };
}
