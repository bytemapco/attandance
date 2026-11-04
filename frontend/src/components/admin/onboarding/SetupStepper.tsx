import React from "react";
import { Check } from "lucide-react";
import type { SetupCheck } from "@/types/setupStatus";
import {
  SETUP_STEPS,
  isStepDone,
  isStepReachable,
  requiredSetupSteps,
  stepIndexById,
} from "@/lib/onboarding/setupSteps";

interface SetupStepperProps {
  checks: SetupCheck[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

/** Responsive step navigation. A step stays locked until its required predecessors are complete. */
export default function SetupStepper({ checks, activeIndex, onSelect }: SetupStepperProps): React.ReactElement {
  const activeStep = SETUP_STEPS[activeIndex];
  const required = requiredSetupSteps();
  const complete = required.filter((step) => isStepDone(step, checks)).length;
  const score = Math.round((complete / required.length) * 100);

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between gap-3 text-sm">
          <h2 className="font-semibold text-foreground">Setup progress</h2>
          <span className="tabular-nums text-muted-foreground">{complete} of {required.length} steps</span>
        </div>
        <div role="progressbar" aria-label="Required setup progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-success transition-[width] duration-300" style={{ width: `${score}%` }} />
        </div>
      </div>

      <div className="lg:hidden">
        <label htmlFor="setup-step-select" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Step {activeIndex + 1} of {SETUP_STEPS.length}
        </label>
        <select
          id="setup-step-select"
          value={activeStep.id}
          onChange={(event) => {
            const nextIndex = stepIndexById(event.target.value);
            if (nextIndex >= 0) onSelect(nextIndex);
          }}
          className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {SETUP_STEPS.map((step, index) => {
            const done = isStepDone(step, checks);
            return (
              <option key={step.id} value={step.id} disabled={!isStepReachable(index, checks)}>
                {step.title}{step.optional ? " (optional)" : ""}{done ? " (complete)" : ""}
              </option>
            );
          })}
        </select>
      </div>

      <nav aria-label="Setup steps" className="hidden lg:block">
        <ol className="space-y-1.5">
          {SETUP_STEPS.map((step, index) => {
            const done = isStepDone(step, checks);
            const active = index === activeIndex;
            const reachable = isStepReachable(index, checks);
            let markerClass = "bg-secondary text-muted-foreground";
            if (done) markerClass = "bg-success text-primary-foreground";
            else if (active) markerClass = "bg-primary text-primary-foreground";
            return (
              <li key={step.id}>
                <button
                  type="button"
                  disabled={!reachable}
                  aria-current={active ? "step" : undefined}
                  onClick={() => onSelect(index)}
                  className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? "border-accent/50 bg-surface shadow-xs"
                      : reachable
                      ? "border-transparent hover:border-border hover:bg-surface"
                      : "border-transparent opacity-45 cursor-not-allowed"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-xs transition-colors ${markerClass}`}
                  >
                    {done ? (
                      <>
                        <Check size={14} className="stroke-[2.5]" aria-hidden />
                        <span className="sr-only">Complete</span>
                      </>
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`block text-sm leading-snug ${active ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                        {step.title}
                      </span>
                      {step.optional && (
                        <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Opt
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
