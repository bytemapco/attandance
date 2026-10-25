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
    <div className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-xl shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
            <Clock size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-foreground">
              Recent Sessions
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Past attendance sessions
            </p>
          </div>
        </div>

        <Link
          href="/teacher/sessions"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          <span>All Sessions</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="p-4 sm:p-5 space-y-2.5">
        {sessions.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Clock size={28} className="mx-auto text-muted-foreground/60" />
            <p className="text-xs font-medium text-foreground">No sessions yet</p>
            <p className="text-[11px] text-muted-foreground">
              Start a session to record attendance.
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
                href={`/teacher/sessions/${session.id}/roster`}
                className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-card/50 hover:bg-secondary/40 hover:border-foreground/20 transition-all shadow-2xs"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${session.isActive ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                    {session.isActive ? (
                      <Radio size={14} className="animate-pulse" />
                    ) : (
                      <Clock size={14} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {session.class_name || "Class"}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <span>{dateStr}</span>
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
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${
                      session.isActive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                        : "bg-muted/70 text-muted-foreground border-border/60"
                    }`}
                  >
                    {session.isActive ? "Live" : "Completed"}
                  </span>
                  <ArrowRight
                    size={13}
                    className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all"
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
