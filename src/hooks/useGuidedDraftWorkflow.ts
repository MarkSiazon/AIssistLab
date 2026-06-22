"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiErrorMessage, readResponseJson } from "@/lib/api/client";
import {
  type GuidedDraft,
  type GuidedFeedback,
  type GuidedValidationError,
} from "@/lib/ui/guided-builder-model";
import { writeGuidedDraftToStorage } from "@/lib/ui/guided-draft-storage";

interface GuidedDraftWorkflowInput {
  input: {
    purpose: string;
    audience: string;
    triggerExamples: string[];
    requiredInputs: string[];
    boundaries: string[];
    successCriteria: string[];
    templateId: string;
  };
  setStep: (step: number) => void;
}

export function useGuidedDraftWorkflow({
  input,
  setStep,
}: GuidedDraftWorkflowInput) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<GuidedFeedback | null>(null);
  const [draft, setDraft] = useState<GuidedDraft | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    GuidedValidationError[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function clearDraftState() {
    setFeedback(null);
    setDraft(null);
  }

  function resetWorkflowState() {
    clearDraftState();
    setValidationErrors([]);
    setMessage(null);
  }

  async function postGuided<T>(url: string): Promise<T | null> {
    setLoading(true);
    setMessage(null);
    setValidationErrors([]);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await readResponseJson(response);
      if (!response.ok) {
        const validationErrors =
          payload &&
          typeof payload === "object" &&
          Array.isArray(
            (payload as { validationErrors?: unknown }).validationErrors,
          )
            ? ((payload as { validationErrors: GuidedValidationError[] })
                .validationErrors)
            : [];
        setValidationErrors(
          validationErrors,
        );
        setMessage(apiErrorMessage(payload, "Review the highlighted fields."));
        return null;
      }
      return payload as T;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function reviewDraft() {
    const payload = await postGuided<{
      ok: boolean;
      feedback: GuidedFeedback;
    }>("/api/skills/guided/feedback");
    if (!payload) return;
    setFeedback(payload.feedback);
    setDraft(null);
    setStep(3);
  }

  async function buildDraft(): Promise<GuidedDraft | null> {
    if (!feedback) {
      setStep(3);
      setMessage("Run rubric feedback before building the draft preview.");
      return null;
    }

    if (feedback.categories.some((category) => category.status === "error")) {
      setStep(3);
      setMessage("Fix rubric errors before building the draft preview.");
      return null;
    }

    const payload = await postGuided<{ ok: boolean; draft: GuidedDraft }>(
      "/api/skills/guided/draft",
    );
    if (!payload) return null;
    setFeedback(payload.draft.feedback);
    setDraft(payload.draft);
    return payload.draft;
  }

  async function openInEditor() {
    if (!draft) {
      setStep(3);
      setMessage("Build the draft preview before opening it in the editor.");
      return;
    }

    if (feedback?.categories.some((category) => category.status === "error")) {
      setStep(3);
      setMessage("Fix rubric errors before opening the draft in the editor.");
      return;
    }

    const stored = writeGuidedDraftToStorage(sessionStorage, draft);
    if (!stored) {
      setMessage(
        "Browser storage is unavailable, so the draft cannot be handed off to the editor in this tab.",
      );
      return;
    }
    router.push("/editor?guidedDraft=1");
  }

  return {
    feedback,
    draft,
    validationErrors,
    loading,
    message,
    clearDraftState,
    resetWorkflowState,
    reviewDraft,
    buildDraft,
    openInEditor,
  };
}
