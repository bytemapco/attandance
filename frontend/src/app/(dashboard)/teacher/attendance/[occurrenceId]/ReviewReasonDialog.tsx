"use client";

import React from "react";
import ReasonDialog from "@/components/ui/ReasonDialog";
import type { RegisterStudentItem } from "@/types";
import type { FlagDecision } from "./useFlaggedReview";

interface ReviewReasonDialogProps {
  student: RegisterStudentItem;
  decision: FlagDecision;
  loading: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

/** A closed register keeps its history, so a decision on it needs a reason. */
export default function ReviewReasonDialog({ student, decision, loading, onConfirm, onCancel }: ReviewReasonDialogProps): React.ReactElement {
  const approving = decision === "APPROVE";
  return (
    <ReasonDialog
      title={`Why are you ${approving ? "approving" : "rejecting"} ${student.student_name}'s mark on a closed register?`}
      confirmLabel={approving ? "Approve" : "Mark absent"}
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
