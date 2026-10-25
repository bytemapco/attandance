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
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-5 sm:p-6 backdrop-blur-xl shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
            <Radio size={20} />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Live Session
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                <Clock size={12} />
                Started at {startTimeStr}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {session.class_name || "Class"}
            </h3>

            {session.subject && (
              <p className="text-xs text-muted-foreground">{session.subject}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
          <Link
            href={`/teacher/sessions/${session.id}/roster`}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <span>View Session</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
