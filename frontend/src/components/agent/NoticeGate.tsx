"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import { getApiErrorMessage } from "@/lib/api";
import { acceptNotice } from "@/services/agent";
import type { AgentStatus } from "@/types/agent";

interface NoticeGateProps {
  status: AgentStatus;
  onAccepted: () => void;
}

export default function NoticeGate({ status, onAccepted }: NoticeGateProps): React.ReactElement {
  const [saving, setSaving] = useState(false);

  if (!status.model_configured) {
    return <p className="p-4 text-sm text-muted-foreground">The assistant is not set up on this server yet. Ask the platform owner to add its model key.</p>;
  }
  if (!status.can_accept_notice) {
    return <p className="p-4 text-sm text-muted-foreground">Your institution admin has not switched the assistant on yet. Ask them to open the assistant and accept the data notice.</p>;
  }

  async function accept(): Promise<void> {
    setSaving(true);
    try {
      await acceptNotice();
      onAccepted();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 p-4 text-sm text-foreground">
      <h3 className="font-semibold">Switch on the assistant for your institution</h3>
      <p className="text-muted-foreground">
        To answer, the assistant sends your question and the attendance details it needs, such as student names, roll
        numbers and attendance records, to Google&apos;s Gemini service. It never sends face data, photos, passwords or login
        tokens. Every change it prepares waits for a person to confirm it, and every action is logged.
      </p>
      <p className="text-muted-foreground">
        Accepting turns it on for all teachers and admins of your institution. Your institution is responsible for this
        processing of student data, so have your data officer or legal adviser approve it first.
      </p>
      <Button onClick={accept} loading={saving}>I accept, switch it on</Button>
    </div>
  );
}
