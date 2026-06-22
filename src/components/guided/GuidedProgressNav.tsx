import { type KeyboardEvent, useEffect, useRef } from "react";
import {
  guidedStepButtonLabel,
  guidedStepIndexForKey,
} from "@/lib/ui/guided-step-labels";

interface GuidedProgressNavProps {
  step: number;
  steps: readonly string[];
  guidance: readonly string[];
  progress: number;
  onSelectStep: (step: number) => void;
}

export function GuidedProgressNav({
  step,
  steps,
  guidance,
  progress,
  onSelectStep,
}: GuidedProgressNavProps) {
  const stepButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pendingStepFocusRef = useRef<number | null>(null);

  useEffect(() => {
    if (pendingStepFocusRef.current === null) return;

    const targetStep = pendingStepFocusRef.current;
    pendingStepFocusRef.current = null;
    stepButtonRefs.current[targetStep]?.focus();
  }, [step]);

  function selectStep(nextStep: number, focusStep = false) {
    if (focusStep) {
      pendingStepFocusRef.current = nextStep;
    }
    onSelectStep(nextStep);
  }

  function handleStepKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const nextStep = guidedStepIndexForKey({
      key: event.key,
      currentIndex: index,
      total: steps.length,
    });
    if (nextStep === null) return;

    event.preventDefault();
    selectStep(nextStep, true);
  }

  return (
    <>
      <section
        className="guided-progress-panel"
        aria-label="Guided builder current step"
      >
        <div className="guided-progress-copy">
          <div className="guided-progress-kicker">
            Step {step + 1} of {steps.length}
          </div>
          <div className="guided-progress-title">{steps[step]}</div>
          <div className="guided-progress-help">{guidance[step]}</div>
        </div>
        <div className="guided-progress-meter-wrap">
          <div
            className="guided-progress-meter-label"
            style={{ color: "var(--text-muted)" }}
          >
            {progress}% complete
          </div>
          <div
            className="guided-progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label={`Guided builder progress: ${progress}% complete`}
          >
            <div
              className="guided-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

      <nav className="guided-step-nav" aria-label="Guided builder progress">
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            ref={(node) => {
              stepButtonRefs.current[index] = node;
            }}
            onClick={() => selectStep(index)}
            onKeyDown={(event) => handleStepKeyDown(event, index)}
            aria-current={step === index ? "step" : undefined}
            aria-label={guidedStepButtonLabel({
              index,
              label,
              total: steps.length,
              current: step === index,
            })}
            className={`guided-step-tab${
              step === index ? " guided-step-tab-active" : ""
            }`}
            style={{
              borderColor: step === index ? "var(--accent)" : "var(--border)",
              color: step === index ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            <span className="guided-step-index" aria-hidden="true">
              {index + 1}
            </span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
