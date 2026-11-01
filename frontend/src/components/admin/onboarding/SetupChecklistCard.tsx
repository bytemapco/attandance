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
    <section aria-labelledby="setup-progress-title" className="space-y-5 rounded-2xl border border-[#e3e1dc] bg-card p-5 shadow-[0_2px_8px_rgba(40,54,59,0.04)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a4d30]">Campus setup</p>
          <h2 id="setup-progress-title" className="text-lg font-semibold text-[#202b30]">
            {readyToGoLive ? "Your campus is ready" : `Next: ${next.title}`}
          </h2>
          <p className="text-sm leading-6 text-[#526f78]">
            {readyToGoLive
              ? "Your key details are in place. Review them to finish setup."
              : nextBlocker}
          </p>
        </div>
        <Link
          href={`/admin/onboarding?step=${next.id}`}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-[#28363b] px-4 text-sm font-medium text-white shadow-xs transition-colors hover:bg-[#1f2b2f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#526f78] active:scale-[0.99]"
        >
          {readyToGoLive ? "Review and activate" : "Continue setup"}
          <ArrowRight size={15} aria-hidden />
        </Link>
      </div>

      <div className="space-y-2">
        <div className="flex gap-1.5" role="progressbar" aria-label="Campus setup progress" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={doneCount}>
          {steps.map((step) => (
            <span key={step.id} className={`h-1.5 flex-1 rounded-full ${isStepDone(step, status.checks) ? "bg-[#247653]" : "bg-[#eeece7]"}`} />
          ))}
        </div>
        <p className="text-xs tabular-nums text-[#526f78]">{doneCount} of {steps.length} steps complete</p>
      </div>

      <ol className="grid gap-2 sm:grid-cols-2" aria-label="Setup steps">
        {steps.map((step, index) => {
          const done = isStepDone(step, status.checks);
          const isNext = !done && step.id === next.id;
          if (done) {
            return (
              <li key={step.id} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-[#526f78]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#247653] text-white">
                  <Check size={13} className="stroke-[3]" aria-hidden />
                </span>
                <span className="line-through decoration-[#c4c0b8]">{step.title}</span>
              </li>
            );
          }
          return (
            <li key={step.id}>
              <Link
                href={`/admin/onboarding?step=${step.id}`}
                aria-current={isNext ? "step" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#526f78] ${
                  isNext
                    ? "border-[#c98260]/60 bg-[#faf7f3] font-semibold text-[#202b30]"
                    : "border-transparent text-[#202b30] hover:border-[#e3e1dc] hover:bg-[#faf8f5]"
                }`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isNext ? "bg-[#28363b] text-white" : "bg-[#eeece7] text-[#526f78]"}`}>
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">{step.title}</span>
                {isNext && <span className="shrink-0 text-xs font-semibold text-[#8a4d30]">Next</span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
