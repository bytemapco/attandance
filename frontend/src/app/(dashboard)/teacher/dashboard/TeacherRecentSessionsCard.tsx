"use client";

import React from "react";
import Link from "next/link";
import { Clock, ArrowRight, Radio } from "lucide-react";
import type { SessionWithClassResponse } from "@/types";

interface TeacherRecentSessionsCardProps {
  sessions: SessionWithClassResponse[];
}

export default function TeacherRecentSessionsCard({
  sessions,
}: TeacherRecentSessionsCardProps): React.ReactElement {
  return (
    <div className="rounded-2xl border border-[#e3e1dc] bg-card shadow-[0_2px_8px_rgba(40,54,59,0.05)] overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-[#e3e1dc] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-secondary text-[#526f78] border border-[#e3e1dc]">
            <Clock size={16} />
          </div>
          <h2 className="text-sm font-bold tracking-tight text-[#202b30]">
            Recent Sessions
          </h2>
        </div>

        <Link
          href="/teacher/sessions"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#28363b] hover:text-[#c98260] transition-colors"
        >
          <span>All Sessions</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="p-4 sm:p-5 space-y-2.5">
        {sessions.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Clock size={28} className="mx-auto text-[#718087]" />
            <p className="text-xs font-semibold text-[#202b30]">No sessions yet</p>
            <p className="text-[11px] text-[#526f78]">
              Start a session to record class attendance.
            </p>
          </div>
        ) : (
          sessions.slice(0, 5).map((session) => {
            const dateStr = new Date(session.startTime).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <Link
                key={session.id}
                href={`/teacher/sessions/${session.id}/attendance-roll`}
                className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-[#e3e1dc] bg-card hover:border-[#c98260]/60 hover:shadow-[0_2px_8px_rgba(40,54,59,0.05)] transition-all"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${session.isActive ? "bg-[#e8f3ed] text-[#247653] border border-[#c6e2d3]" : "bg-[#eeece7] text-[#526f78] border border-[#e3e1dc]"}`}>
                    {session.isActive ? (
                      <Radio size={14} className="animate-pulse" />
                    ) : (
                      <Clock size={14} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#202b30] group-hover:text-[#28363b] transition-colors truncate">
                      {session.class_name || "Class"}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-[#526f78] mt-0.5">
                      <span className="font-mono">{dateStr}</span>
                      {session.subject && (
                        <>
                          <span>•</span>
                          <span className="truncate">{session.subject}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      session.isActive
                        ? "bg-[#e8f3ed] text-[#247653] border-[#c6e2d3]"
                        : "bg-[#eeece7] text-[#526f78] border-[#e3e1dc]"
                    }`}
                  >
                    {session.isActive ? "Live" : "Completed"}
                  </span>
                  <ArrowRight
                    size={13}
                    className="text-[#718087] group-hover:text-[#c98260] group-hover:translate-x-0.5 transition-all"
                  />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
