"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldAlert, CalendarClock, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import type { FlaggedAttendanceResponse, PendingLeaveItem } from "@/types";

interface TeacherPendingQueueCardProps {
  flagged: FlaggedAttendanceResponse[];
  leaves: PendingLeaveItem[];
}

export default function TeacherPendingQueueCard({
  flagged,
  leaves,
}: TeacherPendingQueueCardProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<"flagged" | "leaves">("flagged");

  const totalPending = flagged.length + leaves.length;

  return (
    <div className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-xl shadow-xs overflow-hidden flex flex-col">
      <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <ShieldAlert size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-foreground">
                Review Queue
              </h2>
              {totalPending > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 font-mono">
                  {totalPending}
                </span>
              ) : null}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Pending approvals
            </p>
          </div>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-secondary/70 border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("flagged")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === "flagged"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Flagged ({flagged.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("leaves")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === "leaves"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Leaves ({leaves.length})
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex-1 space-y-2.5">
        {activeTab === "flagged" ? (
          flagged.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="h-10 w-10 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-xs font-semibold text-foreground">No flagged records</p>
              <p className="text-[11px] text-muted-foreground">
                No attendance records need review.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {flagged.slice(0, 4).map((item) => {
                const scorePercent = Math.round((item.final_ai_score || 0) * 100);
                return (
                  <Link
                    key={item.id}
                    href={`/teacher/review/${item.id}`}
                    className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-card/50 hover:bg-secondary/40 hover:border-foreground/20 transition-all shadow-2xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {item.student_name}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          ({item.enrollment_number})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 truncate">
                        <span>{item.class_name}</span>
                        {item.subject && (
                          <>
                            <span>•</span>
                            <span className="truncate">{item.subject}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        <AlertTriangle size={10} />
                        {scorePercent}%
                      </span>
                      <ArrowRight size={13} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                );
              })}
              {flagged.length > 4 && (
                <Link
                  href="/teacher/review"
                  className="block text-center text-xs font-medium text-primary hover:underline pt-1"
                >
                  View all {flagged.length} flagged records →
                </Link>
              )}
            </div>
          )
        ) : leaves.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="h-10 w-10 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CalendarClock size={20} />
            </div>
            <p className="text-xs font-semibold text-foreground">No pending leaves</p>
            <p className="text-[11px] text-muted-foreground">
              No pending leave requests.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {leaves.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                href={`/teacher/leaves/${item.id}`}
                className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-card/50 hover:bg-secondary/40 hover:border-foreground/20 transition-all shadow-2xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {item.student_name}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      ({item.enrollment_number})
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {item.reason || "Leave request"}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Pending
                  </span>
                  <ArrowRight size={13} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
            {leaves.length > 4 && (
              <Link
                href="/teacher/leaves"
                className="block text-center text-xs font-medium text-primary hover:underline pt-1"
              >
                View all {leaves.length} leave requests →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
