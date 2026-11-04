import React from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { SetupStatus } from "@/types/setupStatus";
import {
  SETUP_STEPS,
  firstIncompleteStepIndex,
  isStepDone,
  requiredSetupSteps,
  stepBlockers,
} from "@/lib/onboarding/setupSteps";

interface SetupChecklistCardProps {
  status: SetupStatus;
}

/**
 * Dashboard card while onboarding is unfinished. Names the next step once, shows segmented
 * progress, and lists the remaining required steps in wizard order. Done steps stay quiet.
 */
export default function SetupChecklistCard({ status }: SetupChecklistCardProps): React.ReactElement {
  const steps = requiredSetupSteps();
  const doneCount = steps.filter((step) => isStepDone(step, status.checks)).length;
  const next = SETUP_STEPS[firstIncompleteStepIndex(status.checks)];
  const readyToGoLive = status.ready_to_complete;
  const nextBlocker = stepBlockers(next, status.checks)[0];

  return (
    <section aria-labelledby="setup-progress-title" className="space-y-5 rounded-lg border border-border bg-card p-5 shadow-[0_2px_8px_rgba(40,54,59,0.04)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-strong">Campus setup</p>
          <h2 id="setup-progress-title" className="text-lg font-semibold text-foreground">
            {readyToGoLive ? "Your campus is ready" : `Next: ${next.title}`}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {readyToGoLive
              ? "Your key details are in place. Review them to finish setup."
              : nextBlocker}
          </p>
        </div>
        <Link
          href={`/admin/onboarding?step=${next.id}`}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-muted-foreground"
        >
          {readyToGoLive ? "Review and activate" : "Continue setup"}
          <ArrowRight size={15} aria-hidden />
        </Link>
      </div>

      <div className="space-y-2">
        <div className="flex gap-1.5" role="progressbar" aria-label="Campus setup progress" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={doneCount}>
          {steps.map((step) => (
            <span key={step.id} className={`h-1.5 flex-1 rounded-full ${isStepDone(step, status.checks) ? "bg-success" : "bg-secondary"}`} />
          ))}
        </div>
        <p className="text-xs tabular-nums text-muted-foreground">{doneCount} of {steps.length} steps complete</p>
      </div>

      <ol className="grid gap-2 sm:grid-cols-2" aria-label="Setup steps">
        {steps.map((step, index) => {
          const done = isStepDone(step, status.checks);
          const isNext = !done && step.id === next.id;
          if (done) {
            return (
              <li key={step.id} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success text-primary-foreground">
                  <Check size={13} className="stroke-[3]" aria-hidden />
                </span>
                <span className="line-through decoration-border-strong">{step.title}</span>
              </li>
            );
          }
          return (
            <li key={step.id}>
              <Link
                href={`/admin/onboarding?step=${step.id}`}
                aria-current={isNext ? "step" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-foreground ${
                  isNext
                    ? "border-accent/60 bg-surface font-semibold text-foreground"
                    : "border-transparent text-foreground hover:border-border hover:bg-surface"
                }`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isNext ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">{step.title}</span>
                {isNext && <span className="shrink-0 text-xs font-semibold text-accent-strong">Next</span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
