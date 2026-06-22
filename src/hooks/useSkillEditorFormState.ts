"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  extraFrontmatterFields,
  type SkillTemplate,
} from "@/lib/ui/skill-editor-model";
import { skillEditorSnapshot } from "@/hooks/skill-editor-snapshot";
import {
  useSkillEditorBootstrap,
  type SkillEditorDraftValues,
} from "@/hooks/useSkillEditorBootstrap";
import { useSkillEditorSaveWorkflow } from "@/hooks/useSkillEditorSaveWorkflow";
import { useSkillEditorValidationState } from "@/hooks/useSkillEditorValidationState";
import { skillEditorHref } from "@/lib/ui/skill-action-links";

export interface SkillEditorFormStateInput {
  initialName: string;
  initialDescription: string;
  initialTags: string[];
  initialFrontmatter: Record<string, unknown>;
  initialBody: string;
  mode: "create" | "edit";
}

export function useSkillEditorFormState({
  initialName,
  initialDescription,
  initialTags,
  initialFrontmatter,
  initialBody,
  mode,
}: SkillEditorFormStateInput) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [tagsInput, setTagsInput] = useState(initialTags.join(", "));
  const [body, setBody] = useState(initialBody);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<SkillTemplate | null>(
    null,
  );
  const [templateFrontmatter, setTemplateFrontmatter] = useState<
    Record<string, unknown>
  >(() => extraFrontmatterFields(initialFrontmatter));
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() =>
    skillEditorSnapshot({
      name: initialName,
      description: initialDescription,
      tagsInput: initialTags.join(", "),
      body: initialBody,
    }),
  );
  const discardStayButtonRef = useRef<HTMLButtonElement | null>(null);
  const templateKeepButtonRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();

  const parsedTags = useMemo(
    () =>
      tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsInput],
  );

  const currentSnapshot = useMemo(
    () => skillEditorSnapshot({ name, description, tagsInput, body }),
    [body, description, name, tagsInput],
  );
  const hasUnsavedChanges = currentSnapshot !== lastSavedSnapshot;

  const validation = useSkillEditorValidationState({
    name,
    description,
    parsedTags,
    body,
  });

  const onCreatedSkill = useCallback(
    (skillName: string) => router.push(skillEditorHref(skillName)),
    [router],
  );
  const saveWorkflow = useSkillEditorSaveWorkflow({
    mode,
    name,
    description,
    parsedTags,
    tagsInput,
    body,
    templateFrontmatter,
    clientValidationErrors: validation.clientValidationErrors,
    fieldsReady: validation.fieldsReady,
    hasUnsavedChanges,
    touchAllFields: validation.touchAllFields,
    setValidationErrors: validation.setValidationErrors,
    setLastSavedSnapshot,
    onCreatedSkill,
  });
  const { clearServerValidation } = validation;
  const { clearSavedNotice } = saveWorkflow;

  const applyGuidedDraft = useCallback(
    (values: SkillEditorDraftValues) => {
      if (typeof values.name === "string") setName(values.name);
      if (typeof values.body === "string") setBody(values.body);
      setDescription(values.description);
      setTagsInput(values.tagsInput);
      setTemplateFrontmatter(values.templateFrontmatter);
      clearServerValidation();
      clearSavedNotice();
    },
    [clearSavedNotice, clearServerValidation],
  );
  const { templates } = useSkillEditorBootstrap({
    mode,
    onGuidedDraft: applyGuidedDraft,
  });

  function requestCancel() {
    if (!hasUnsavedChanges) {
      router.push("/skills");
      return;
    }

    setConfirmDiscard(true);
  }

  function discardAndLeave() {
    setConfirmDiscard(false);
    router.push("/skills");
  }

  function applyTemplate(template: SkillTemplate) {
    const frontmatter = template.initialFrontmatter;
    setDescription(
      typeof frontmatter.description === "string"
        ? frontmatter.description
        : template.description,
    );
    setTagsInput(
      Array.isArray(frontmatter.tags)
        ? frontmatter.tags.filter((tag) => typeof tag === "string").join(", ")
        : template.category,
    );
    setBody(template.initialBody);
    setTemplateFrontmatter(extraFrontmatterFields(frontmatter));
    validation.resetValidation();
    saveWorkflow.clearSavedNotice();
    setConfirmDiscard(false);
    setPendingTemplate(null);
  }

  function requestApplyTemplate(template: SkillTemplate) {
    if (!hasUnsavedChanges) {
      applyTemplate(template);
      return;
    }

    setConfirmDiscard(false);
    setPendingTemplate(template);
  }

  function confirmApplyTemplate() {
    if (!pendingTemplate) return;
    applyTemplate(pendingTemplate);
  }

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      setConfirmDiscard(false);
      setPendingTemplate(null);
    }
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!confirmDiscard) return;
    discardStayButtonRef.current?.focus();
  }, [confirmDiscard]);

  useEffect(() => {
    if (!pendingTemplate) return;
    templateKeepButtonRef.current?.focus();
  }, [pendingTemplate]);

  return {
    body,
    bodyError: validation.bodyError,
    confirmApplyTemplate,
    confirmDiscard,
    description,
    descriptionError: validation.descriptionError,
    discardAndLeave,
    discardStayButtonRef,
    error: saveWorkflow.error,
    fieldsReady: validation.fieldsReady,
    hasServerValidationErrors: validation.hasServerValidationErrors,
    hasUnsavedChanges,
    markFieldTouched: validation.markFieldTouched,
    name,
    nameError: validation.nameError,
    parsedTags,
    pendingTemplate,
    requestApplyTemplate,
    requestCancel,
    save: saveWorkflow.save,
    saveAction: saveWorkflow.saveAction,
    saved: saveWorkflow.saved,
    savedMessage: saveWorkflow.savedMessage,
    setBody,
    setConfirmDiscard,
    setDescription,
    setName,
    setPendingTemplate,
    setTagsInput,
    setupChecks: validation.setupChecks,
    tagsError: validation.tagsError,
    tagsInput,
    templateKeepButtonRef,
    templates,
    activeValidationErrors: validation.activeValidationErrors,
  };
}
