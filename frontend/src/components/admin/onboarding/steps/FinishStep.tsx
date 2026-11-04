"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import type { SetupIncompleteDetail } from "@/types/setupStatus";
import GlassButton from "@/components/ui/GlassButton";
import type { StepProps } from "./stepProps";

function missingFrom(err: unknown): SetupIncompleteDetail | null {
  const detail = (err as { response?: { status?: number; data?: { detail?: SetupIncompleteDetail } } })?.response;
  return detail?.status === 409 && detail.data?.detail ? detail.data.detail : null;
}

export default function FinishStep({ status, refresh }: StepProps): React.ReactElement {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const remaining = status.checks.filter((check) => check.required && !check.done);
  const canFinish = status.ready_to_complete;
  const issueIds = missing.length > 0 ? missing : remaining.map((check) => check.id);
  const issueTitle = missing.length > 0
    ? "Some setup details changed. Review these items and try again."
    : "Complete these items to finish setup.";
  const summaryTitle = canFinish
    ? "All required details are complete"
    : `${remaining.length} required ${remaining.length === 1 ? "item remains" : "items remain"}`;
  const summaryMessage = canFinish ? "Finish setup to return to the dashboard." : issueTitle;

  async function finish(): Promise<void> {
    if (!canFinish || busy) return;
    setBusy(true);
    setMissing([]);
    try {
      await api.post("/admin/setup/complete");
      toast.success("Setup complete. Your institution is ready for attendance.");
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      const incomplete = missingFrom(err);
      if (incomplete) setMissing(incomplete.missing);
      else toast.error(getApiErrorMessage(err, "Could not finish setup"));
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl bg-background p-4">
        {canFinish ? (
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-success" aria-hidden />
        ) : (
          <Circle size={20} className="mt-0.5 shrink-0 text-warning" aria-hidden />
        )}
        <div>
          <p className="font-semibold text-foreground">{summaryTitle}</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{summaryMessage}</p>
        </div>
      </div>

      {(!canFinish || missing.length > 0) && (
        <div role={missing.length > 0 ? "alert" : undefined} className={missing.length > 0 ? "rounded-lg border border-warning-border bg-warning-soft p-4" : undefined}>
          {missing.length > 0 && <p className="mb-2 text-sm font-medium text-warning">{issueTitle}</p>}
          <ul className="space-y-2" aria-label="Required items to complete">
            {issueIds.map((id) => (
              <li key={id} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Circle size={14} className="text-accent-strong" aria-hidden />
                {status.checks.find((check) => check.id === id)?.label ?? id}
              </li>
            ))}
          </ul>
        </div>
      )}

      <GlassButton variant="primary" loading={busy} disabled={!canFinish} onClick={() => void finish()}>
        Finish setup
      </GlassButton>
    </div>
  );
}
