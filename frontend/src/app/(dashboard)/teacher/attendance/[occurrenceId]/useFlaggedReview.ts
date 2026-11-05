"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import { FLAGGED_CHANGED_EVENT } from "@/lib/flaggedEvents";
import type { RegisterStudentItem } from "@/types";

export type FlagDecision = "APPROVE" | "REJECT";

interface Pending {
  student: RegisterStudentItem;
  decision: FlagDecision;
}

interface Options {
  base: string;
  /** A closed register needs a reason for every change. */
  locked: boolean;
  refresh: () => Promise<void>;
}

const DONE: Record<FlagDecision, string> = {
  APPROVE: "Approved. Counted as present.",
  REJECT: "Marked absent.",
};

/** Decides on flagged marks one at a time. Each decision is saved at once and does not wait for the page's Save. */
export function useFlaggedReview({ base, locked, refresh }: Options) {
  const [deciding, setDeciding] = useState<Pending | null>(null);
  const [needsReason, setNeedsReason] = useState<Pending | null>(null);

  async function send(item: Pending, note?: string): Promise<void> {
    setDeciding(item);
    try {
      await api.post(`${base}/flagged/${item.student.record_id}/resolve`, { decision: item.decision, note });
      toast.success(`${item.student.student_name}: ${DONE[item.decision]}`);
      window.dispatchEvent(new Event(FLAGGED_CHANGED_EVENT));
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Could not save your decision"));
    } finally {
      setDeciding(null);
      // Show what the server now says, including when someone else already decided this mark.
      await refresh();
    }
  }

  const decide = (student: RegisterStudentItem, decision: FlagDecision): void => {
    if (deciding) return;
    if (locked) setNeedsReason({ student, decision });
    else void send({ student, decision });
  };

  const confirmReason = async (reason: string): Promise<void> => {
    if (!needsReason) return;
    await send(needsReason, reason);
    setNeedsReason(null);
  };

  return { deciding, needsReason, decide, confirmReason, cancelReason: () => setNeedsReason(null) };
}
