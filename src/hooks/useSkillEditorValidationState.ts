"use client";

import { useCallback, useMemo, useState } from "react";
import {
  buildSkillEditorSetupChecks,
  validateClientSkill,
  type SkillValidationError,
  type SkillValidationField,
} from "@/lib/ui/skill-editor-model";

interface SkillEditorValidationStateInput {
  name: string;
  description: string;
  parsedTags: string[];
  body: string;
}

export function useSkillEditorValidationState({
  name,
  description,
  parsedTags,
  body,
}: SkillEditorValidationStateInput) {
  const [validationErrors, setValidationErrors] = useState<
    SkillValidationError[]
  >([]);
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<SkillValidationField, boolean>>
  >({});

  const clientValidationErrors = useMemo(
    () =>
      validateClientSkill({
        name,
        description,
        tags: parsedTags,
        body,
      }),
    [body, description, name, parsedTags],
  );

  const visibleClientValidationErrors = useMemo(
    () => clientValidationErrors.filter((item) => touchedFields[item.field]),
    [clientValidationErrors, touchedFields],
  );
  const activeValidationErrors =
    validationErrors.length > 0
      ? validationErrors
      : visibleClientValidationErrors;

  const fieldsReady = clientValidationErrors.length === 0;
  const hasServerValidationErrors = validationErrors.length > 0;
  const setupChecks = useMemo(
    () =>
      buildSkillEditorSetupChecks({
        validationErrors: clientValidationErrors,
        name,
        description,
        parsedTags,
        body,
      }),
    [body, clientValidationErrors, description, name, parsedTags],
  );

  const markFieldTouched = useCallback((field: SkillValidationField) => {
    setTouchedFields((current) =>
      current[field] ? current : { ...current, [field]: true },
    );
  }, []);

  const touchAllFields = useCallback(() => {
    setTouchedFields({
      name: true,
      description: true,
      tags: true,
      body: true,
    });
  }, []);

  const clearServerValidation = useCallback(() => {
    setValidationErrors([]);
  }, []);

  const resetValidation = useCallback(() => {
    setValidationErrors([]);
    setTouchedFields({});
  }, []);

  return {
    activeValidationErrors,
    bodyError: activeValidationErrors.find((item) => item.field === "body"),
    clearServerValidation,
    clientValidationErrors,
    descriptionError: activeValidationErrors.find(
      (item) => item.field === "description",
    ),
    fieldsReady,
    hasServerValidationErrors,
    markFieldTouched,
    nameError: activeValidationErrors.find((item) => item.field === "name"),
    resetValidation,
    setValidationErrors,
    setupChecks,
    tagsError: activeValidationErrors.find((item) => item.field === "tags"),
    touchAllFields,
  };
}
