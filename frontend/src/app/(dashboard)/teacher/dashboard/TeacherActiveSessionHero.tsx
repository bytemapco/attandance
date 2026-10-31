"use client";

import React from "react";
import Link from "next/link";
import { Radio, ArrowRight, Clock } from "lucide-react";
import type { SessionWithClassResponse } from "@/types";

interface TeacherActiveSessionHeroProps {
  session: SessionWithClassResponse | null;
}

export default function TeacherActiveSessionHero({
  session,
}: TeacherActiveSessionHeroProps): React.ReactElement | null {
  if (!session) return null;

  const startTimeStr = new Date(session.startTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#c6e2d3] bg-[#e8f3ed]/60 p-5 sm:p-6 shadow-[0_2px_8px_rgba(40,54,59,0.04)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f3ed] text-[#247653] border border-[#c6e2d3]">
            <Radio size={20} />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-[#e8f3ed] text-[#247653] border border-[#c6e2d3]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#247653] animate-pulse" />
                Live Session
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[#526f78] font-medium">
                <Clock size={12} />
                Started at {startTimeStr}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#202b30]">
              {session.class_name || "Class"}
            </h3>

            {session.subject && (
              <p className="text-xs text-[#526f78]">{session.subject}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
          <Link
            href={`/teacher/sessions/${session.id}/attendance-roll`}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-[#28363b] hover:bg-[#1f2b2f] active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <span>Open Attendance Roster</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
