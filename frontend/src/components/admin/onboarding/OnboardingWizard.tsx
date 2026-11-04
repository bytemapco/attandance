"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useSetupStatus } from "@/hooks/useSetupStatus";
import {
  SETUP_STEPS,
  canContinue,
  firstIncompleteStepIndex,
  isStepReachable,
  stepBlockers,
  stepIndexById,
  type StepId,
} from "@/lib/onboarding/setupSteps";
import GlassButton from "@/components/ui/GlassButton";
import GlassCard from "@/components/ui/GlassCard";
import GlassLoader from "@/components/ui/GlassLoader";
import GlassErrorState from "@/components/ui/GlassErrorState";
import SetupStepper from "./SetupStepper";
import StepFrame from "./StepFrame";
import type { StepProps } from "./steps/stepProps";
import CampusStep from "./steps/CampusStep";
import StructureStep from "./steps/StructureStep";
import SubjectsStep from "./steps/SubjectsStep";
import AttendanceRulesStep from "./steps/AttendanceRulesStep";
import PeopleStep from "./steps/PeopleStep";
import ClassStep from "./steps/ClassStep";
import FinishStep from "./steps/FinishStep";

const STEP_COMPONENTS: Record<StepId, React.ComponentType<StepProps>> = {
  campus: CampusStep,
  structure: StructureStep,
  subjects: SubjectsStep,
  year: AttendanceRulesStep,
  people: PeopleStep,
  class: ClassStep,
  finish: FinishStep,
};

interface OnboardingWizardProps {
  /** Step to open on, from a dashboard "complete this" link. Defaults to the first unfinished step. */
  initialStepId?: string | null;
}

export default function OnboardingWizard({ initialStepId = null }: OnboardingWizardProps = {}): React.ReactElement {
  const { status, loading, failed, refresh } = useSetupStatus();
  const [index, setIndex] = useState(0);
  const [continuing, setContinuing] = useState(false);
  const continueActionRef = useRef<(() => Promise<boolean>) | null>(null);
  const opened = useRef(false);
  const registerContinueAction = useCallback((action: (() => Promise<boolean>) | null): void => {
    continueActionRef.current = action;
  }, []);

  // Open once, when the status first arrives: on the requested step, else the first unfinished one.
  useEffect(() => {
    if (status && !opened.current) {
      opened.current = true;
      const requested = stepIndexById(initialStepId);
      const usable = requested !== -1 && isStepReachable(requested, status.checks);
      setIndex(usable ? requested : firstIncompleteStepIndex(status.checks));
    }
  }, [status, initialStepId]);

  if (loading) return <div className="flex min-h-0 flex-1 items-center justify-center"><GlassLoader /></div>;
  if (failed || !status) return <div className="flex min-h-0 flex-1 items-center justify-center"><GlassErrorState message="Could not load your setup progress." onRetry={() => void refresh()} /></div>;

  if (status.completed) {
    return (
      <GlassCard className="flex flex-col items-center gap-3 p-10 text-center">
        <CheckCircle2 size={40} className="text-success" aria-hidden />
        <h2 className="text-xl font-semibold text-foreground">Setup is complete</h2>
        <p className="max-w-md text-sm text-muted-foreground">Everything required for attendance is in place. You can change any of it from Master Data or Settings.</p>
        <Link
          href="/admin/dashboard"
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-foreground"
        >
          Go to dashboard
        </Link>
      </GlassCard>
    );
  }

  const step = SETUP_STEPS[index];
  const Current = STEP_COMPONENTS[step.id];
  const last = index === SETUP_STEPS.length - 1;
  const blockers = step.id === "finish" || step.id === "campus" ? [] : stepBlockers(step, status.checks);
  const skipOptionalStep = step.optional && !canContinue({ ...step, optional: false }, status.checks);
  const continueLabel = skipOptionalStep ? "Skip for now" : "Continue";
  // These steps save their own inputs on Continue, so they are not gated by completion.
  const savesOnContinue = step.id === "campus" || step.id === "year";

  async function continueToNextStep(): Promise<void> {
    if (continuing) return;
    setContinuing(true);
    try {
      if (savesOnContinue) {
        const ok = await continueActionRef.current?.();
        if (!ok) return;
      }
      setIndex((current) => current + 1);
    } finally {
      setContinuing(false);
    }
  }

  return (
    <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 lg:grid-cols-[18.5rem_minmax(0,1fr)] lg:grid-rows-1 lg:gap-5">
      <aside className="min-h-0 overflow-y-auto pr-0.5">
        <SetupStepper checks={status.checks} activeIndex={index} onSelect={setIndex} />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-col gap-3">
        <StepFrame title={step.title} blockers={blockers} scrollContent={step.id !== "campus"}>
          <Current status={status} refresh={refresh} registerContinueAction={registerContinueAction} />
        </StepFrame>

        <div className="flex shrink-0 flex-col gap-2 border-t border-border pt-2 sm:flex-row sm:items-center sm:justify-between">
          {index > 0 ? (
            <GlassButton variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => setIndex(index - 1)}>
              Back
            </GlassButton>
          ) : <span />}
          <div className="flex items-center justify-end gap-3">
            {!last && (
              <GlassButton
                variant="primary"
                loading={continuing}
                disabled={continuing || (!savesOnContinue && !canContinue(step, status.checks))}
                onClick={() => void continueToNextStep()}
              >
                {continueLabel}
                <ArrowRight size={15} className="ml-1.5" aria-hidden />
              </GlassButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
