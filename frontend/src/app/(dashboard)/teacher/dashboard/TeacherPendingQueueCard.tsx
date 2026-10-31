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
    <div className="rounded-2xl border border-[#e3e1dc] bg-card shadow-[0_2px_8px_rgba(40,54,59,0.05)] overflow-hidden flex flex-col">
      <div className="p-4 sm:p-5 border-b border-[#e3e1dc] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#fbf1df] text-[#8a5b12] border border-[#f2deba]">
            <ShieldAlert size={16} />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-tight text-[#202b30]">
              Review Queue
            </h2>
            {totalPending > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#fbf1df] text-[#8a5b12] border border-[#f2deba] font-mono">
                {totalPending}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-secondary border border-[#e3e1dc]">
          <button
            type="button"
            onClick={() => setActiveTab("flagged")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === "flagged"
                ? "bg-card text-[#202b30] shadow-2xs"
                : "text-[#526f78] hover:text-[#202b30]"
            }`}
          >
            Flagged ({flagged.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("leaves")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === "leaves"
                ? "bg-card text-[#202b30] shadow-2xs"
                : "text-[#526f78] hover:text-[#202b30]"
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
              <div className="h-10 w-10 mx-auto rounded-full bg-[#e8f3ed] text-[#247653] flex items-center justify-center border border-[#c6e2d3]">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-xs font-bold text-[#202b30]">No records need review</p>
              <p className="text-[11px] text-[#526f78]">
                All student attendance records are verified.
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
                    className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-[#e3e1dc] bg-card hover:border-[#c98260]/60 hover:shadow-[0_2px_8px_rgba(40,54,59,0.05)] transition-all"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#202b30] truncate group-hover:text-[#28363b] transition-colors">
                          {item.student_name}
                        </span>
                        <span className="text-[10px] font-mono text-[#526f78]">
                          ({item.enrollment_number})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#526f78] mt-0.5 truncate">
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-[#fbf1df] text-[#8a5b12] border border-[#f2deba]">
                        <AlertTriangle size={10} />
                        {scorePercent}%
                      </span>
                      <ArrowRight size={13} className="text-[#718087] group-hover:text-[#c98260] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                );
              })}
              {flagged.length > 4 && (
                <Link
                  href="/teacher/review"
                  className="block text-center text-xs font-semibold text-[#28363b] hover:text-[#c98260] pt-1"
                >
                  View all {flagged.length} flagged records →
                </Link>
              )}
            </div>
          )
        ) : leaves.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="h-10 w-10 mx-auto rounded-full bg-[#e8f3ed] text-[#247653] flex items-center justify-center border border-[#c6e2d3]">
              <CalendarClock size={20} />
            </div>
            <p className="text-xs font-bold text-[#202b30]">No pending leave requests</p>
            <p className="text-[11px] text-[#526f78]">
              All student leave requests have been processed.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {leaves.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                href={`/teacher/leaves/${item.id}`}
                className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-[#e3e1dc] bg-card hover:border-[#c98260]/60 hover:shadow-[0_2px_8px_rgba(40,54,59,0.05)] transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#202b30] truncate group-hover:text-[#28363b] transition-colors">
                      {item.student_name}
                    </span>
                    <span className="text-[10px] font-mono text-[#526f78]">
                      ({item.enrollment_number})
                    </span>
                  </div>
                  <p className="text-[11px] text-[#526f78] truncate mt-0.5">
                    {item.reason || "Leave request"}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fbf1df] text-[#8a5b12] border border-[#f2deba]">
                    Pending
                  </span>
                  <ArrowRight size={13} className="text-[#718087] group-hover:text-[#c98260] group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
            {leaves.length > 4 && (
              <Link
                href="/teacher/leaves"
                className="block text-center text-xs font-semibold text-[#28363b] hover:text-[#c98260] pt-1"
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
