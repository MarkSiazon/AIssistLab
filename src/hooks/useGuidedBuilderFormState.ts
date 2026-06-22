"use client";

import { useCallback, useMemo, useState } from "react";
import {
  guidedFormHasContent,
  type GuidedFormSnapshot,
  type GuidedFormSnapshotInput,
} from "@/lib/skills/guided-autosave";
import { splitGuidedLines } from "@/lib/ui/guided-builder-model";

export type GuidedField =
  | "purpose"
  | "audience"
  | "triggerExamples"
  | "requiredInputs"
  | "boundaries"
  | "successCriteria";

const DEFAULT_TEMPLATE_ID = "learning-rubric";

export function useGuidedBuilderFormState() {
  const [step, setStep] = useState(0);
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [purpose, setPurpose] = useState("");
  const [audience, setAudience] = useState("");
  const [triggerExamples, setTriggerExamples] = useState("");
  const [requiredInputs, setRequiredInputs] = useState("");
  const [boundaries, setBoundaries] = useState("");
  const [successCriteria, setSuccessCriteria] = useState("");

  const values = useMemo(
    () => ({
      purpose,
      audience,
      triggerExamples,
      requiredInputs,
      boundaries,
      successCriteria,
    }),
    [
      audience,
      boundaries,
      purpose,
      requiredInputs,
      successCriteria,
      triggerExamples,
    ],
  );

  const input = useMemo(
    () => ({
      purpose,
      audience,
      triggerExamples: splitGuidedLines(triggerExamples),
      requiredInputs: splitGuidedLines(requiredInputs),
      boundaries: splitGuidedLines(boundaries),
      successCriteria: splitGuidedLines(successCriteria),
      templateId,
    }),
    [
      audience,
      boundaries,
      purpose,
      requiredInputs,
      successCriteria,
      templateId,
      triggerExamples,
    ],
  );

  const formSnapshotInput: GuidedFormSnapshotInput = useMemo(
    () => ({
      step,
      templateId,
      purpose,
      audience,
      triggerExamples,
      requiredInputs,
      boundaries,
      successCriteria,
    }),
    [
      audience,
      boundaries,
      purpose,
      requiredInputs,
      step,
      successCriteria,
      templateId,
      triggerExamples,
    ],
  );

  const formHasContent = useMemo(
    () => guidedFormHasContent(formSnapshotInput),
    [formSnapshotInput],
  );

  const restoreSnapshot = useCallback((snapshot: GuidedFormSnapshot) => {
    setStep(snapshot.step);
    setTemplateId(snapshot.templateId || DEFAULT_TEMPLATE_ID);
    setPurpose(snapshot.purpose);
    setAudience(snapshot.audience);
    setTriggerExamples(snapshot.triggerExamples);
    setRequiredInputs(snapshot.requiredInputs);
    setBoundaries(snapshot.boundaries);
    setSuccessCriteria(snapshot.successCriteria);
  }, []);

  const resetFormFields = useCallback(() => {
    setTemplateId(DEFAULT_TEMPLATE_ID);
    setStep(0);
    setPurpose("");
    setAudience("");
    setTriggerExamples("");
    setRequiredInputs("");
    setBoundaries("");
    setSuccessCriteria("");
  }, []);

  const changeField = useCallback((field: GuidedField, value: string) => {
    const setters = {
      purpose: setPurpose,
      audience: setAudience,
      triggerExamples: setTriggerExamples,
      requiredInputs: setRequiredInputs,
      boundaries: setBoundaries,
      successCriteria: setSuccessCriteria,
    };
    setters[field](value);
  }, []);

  return {
    step,
    setStep,
    templateId,
    setTemplateId,
    values,
    input,
    formSnapshotInput,
    formHasContent,
    restoreSnapshot,
    resetFormFields,
    changeField,
  };
}
