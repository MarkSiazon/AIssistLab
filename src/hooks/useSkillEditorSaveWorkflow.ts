"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveSkillEditor } from "@/lib/editor/skill-editor-api";
import type { SkillValidationError } from "@/lib/ui/skill-editor-model";
import { buildSkillEditorSaveAction } from "@/lib/ui/skill-editor-save-action";
import { skillEditorSnapshot } from "@/hooks/skill-editor-snapshot";

interface SkillEditorSaveWorkflowInput {
  mode: "create" | "edit";
  name: string;
  description: string;
  parsedTags: string[];
  tagsInput: string;
  body: string;
  templateFrontmatter: Record<string, unknown>;
  clientValidationErrors: SkillValidationError[];
  fieldsReady: boolean;
  hasUnsavedChanges: boolean;
  touchAllFields: () => void;
  setValidationErrors: (errors: SkillValidationError[]) => void;
  setLastSavedSnapshot: (snapshot: string) => void;
  onCreatedSkill: (name: string) => void;
}

export function useSkillEditorSaveWorkflow({
  mode,
  name,
  description,
  parsedTags,
  tagsInput,
  body,
  templateFrontmatter,
  clientValidationErrors,
  fieldsReady,
  hasUnsavedChanges,
  touchAllFields,
  setValidationErrors,
  setLastSavedSnapshot,
  onCreatedSkill,
}: SkillEditorSaveWorkflowInput) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedMessage, setSavedMessage] = useState("Saved");
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveAction = useMemo(
    () =>
      buildSkillEditorSaveAction({
        saving,
        fieldsReady,
        hasUnsavedChanges,
        validationErrorCount: clientValidationErrors.length,
      }),
    [clientValidationErrors.length, fieldsReady, hasUnsavedChanges, saving],
  );

  const clearSavedTimer = useCallback(() => {
    if (!savedTimerRef.current) return;
    clearTimeout(savedTimerRef.current);
    savedTimerRef.current = null;
  }, []);

  const clearSavedNotice = useCallback(() => {
    clearSavedTimer();
    setSaved(false);
  }, [clearSavedTimer]);

  useEffect(() => clearSavedTimer, [clearSavedTimer]);

  const save = useCallback(async () => {
    setError(null);
    setValidationErrors([]);
    touchAllFields();
    if (clientValidationErrors.length > 0) return;
    if (!hasUnsavedChanges || saving) return;

    setSaving(true);
    setSaved(false);
    clearSavedTimer();

    try {
      const data = await saveSkillEditor({
        mode,
        name,
        description,
        tags: parsedTags,
        body,
        templateFrontmatter,
      });

      if (!data.ok) {
        setValidationErrors(data.validationErrors);
        setError(data.error ?? "Save failed");
        return;
      }

      setLastSavedSnapshot(
        skillEditorSnapshot({ name, description, tagsInput, body }),
      );
      setValidationErrors([]);
      setSavedMessage(
        data.indexStateStatus === "stale"
          ? "Saved. Index marked stale."
          : "Saved",
      );
      setSaved(true);
      savedTimerRef.current = setTimeout(() => setSaved(false), 3000);
      if (mode === "create") {
        onCreatedSkill(name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }, [
    body,
    clearSavedTimer,
    clientValidationErrors.length,
    description,
    hasUnsavedChanges,
    mode,
    name,
    onCreatedSkill,
    parsedTags,
    saving,
    setLastSavedSnapshot,
    setValidationErrors,
    tagsInput,
    templateFrontmatter,
    touchAllFields,
  ]);

  return {
    clearSavedNotice,
    error,
    save,
    saveAction,
    saved,
    savedMessage,
    saving,
  };
}
