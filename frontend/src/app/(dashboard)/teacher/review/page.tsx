"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import api, { getApiErrorMessage } from "@/lib/api";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import PageSkeleton from "@/components/ui/PageSkeleton";
import PageHeader from "@/components/ui/PageHeader";
import type { FlaggedRecord } from "@/types";

const METHOD: Record<string, string> = { AI_BIOMETRIC: "Face", QR_CODE: "QR code", SMART_PASS_OFFLINE: "Smart Pass" };

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export default function ReviewQueuePage(): React.ReactElement {
  const [items, setItems] = useState<FlaggedRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<FlaggedRecord[]>("/faculty/flagged");
      setItems(data);
      setError(null);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Could not load marks to verify"));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!items) return <PageSkeleton />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Verify attendance"
        description="Students whose attendance needs your decision. Open the register to mark them present or absent."
      />
      {items.length === 0 ? (
        <EmptyState title="Nothing to verify" message="Marks that need your check will appear here. Nothing needs your action right now." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {items.map((item) => (
            <li key={item.record_id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {item.student_name} <span className="font-mono text-xs font-normal text-muted-foreground">{item.enrollment_number}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.subject_name} · {item.class_code} · {formatDate(item.date)}, {item.time_range}
                </p>
                <p className="flex items-start gap-1.5 text-xs text-warning">
                  <AlertTriangle size={13} className="mt-px shrink-0" aria-hidden />
                  {item.remarks ?? "Needs your review"}
                </p>
              </div>
              <Badge variant="warning">To verify · {METHOD[item.method] ?? item.method}</Badge>
              <Link
                href={`/teacher/attendance/${item.occurrence_id}`}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-xs font-semibold text-foreground outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.locked ? "View register" : "Review in register"} <ArrowRight size={14} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
