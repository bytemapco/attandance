"use client";

import React from "react";
import { Clock, ArrowRight, User, Network, ShieldAlert } from "lucide-react";
import Link from "next/link";
import type { AuditLogResponse } from "@/types";

interface SystemEventsCardProps {
  events: AuditLogResponse[];
}

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  } catch {
    return "Recent";
  }
}

function formatEventName(rawName: string): string {
  if (!rawName) return "System Activity";
  
  const knownMap: Record<string, string> = {
    CREATESTUDENT: "Create Student",
    CREATETEACHER: "Create Teacher",
    CREATECLASS: "Create Class",
    ENROLLSTUDENTS: "Enroll Students",
    ENROLL_STUDENTS: "Enroll Students",
    LOGIN_ATTEMPT: "User Login",
    SYSTEM_EVENT: "System Event",
    AUTH_LOGIN: "Authentication",
    SCAN_COMPLETED: "AI Scan Completed",
    CONFIG_UPDATED: "Config Updated",
  };

  const normalized = rawName.trim().toUpperCase();
  if (knownMap[normalized]) return knownMap[normalized];

  const spaced = rawName
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();

  return spaced
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function SystemEventsCard({ events }: SystemEventsCardProps): React.ReactElement {
  const displayEvents = events.slice(0, 5);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden flex flex-col justify-between h-full">
      <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400">
            <Clock size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Recent Activity
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Latest administrative and security actions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live</span>
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-4 divide-y divide-border/50 flex-1">
        {displayEvents.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <ShieldAlert size={24} className="mx-auto text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No recent audit events recorded.</p>
          </div>
        ) : (
          displayEvents.map((evt) => {
            const isSuccess = evt.severity === "INFO" || evt.severity === "LOW" || !evt.severity;
            const isWarning = evt.severity === "WARNING" || evt.severity === "MEDIUM";
            const rawEvent = (evt.eventType || (evt as { action?: string }).action) ?? "SYSTEM_EVENT";
            const formattedTitle = formatEventName(rawEvent);

            return (
              <div
                key={evt.id}
                className="py-2.5 px-2 rounded-lg hover:bg-secondary/40 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isSuccess ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-rose-500"
                      }`}
                    />
                    <p className="text-xs font-semibold text-foreground truncate tracking-tight">
                      {formattedTitle}
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground shrink-0 font-mono">
                    {formatRelativeTime(evt.timestamp || (evt as { createdAt?: string }).createdAt || new Date().toISOString())}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-1 pl-4">
                  {evt.description ||
                    ((evt as { details?: Record<string, unknown> }).details
                      ? JSON.stringify((evt as { details?: Record<string, unknown> }).details)
                      : "System activity log entry")}
                </p>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 pl-4">
                  <span className="flex items-center gap-1 font-mono truncate max-w-[200px]">
                    <User size={11} className="text-muted-foreground" />
                    {evt.actor || (evt as { performedBy?: string }).performedBy || "System"}
                  </span>
                  <span className="flex items-center gap-1 font-mono bg-secondary/70 px-1.5 py-0.5 rounded border border-border/30">
                    <Network size={10} className="text-muted-foreground" />
                    {evt.ip || "127.0.0.1"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-5 py-3 border-t border-border bg-secondary/15 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Recent entries</span>
        <Link href="/admin/audit" className="text-primary hover:underline font-semibold inline-flex items-center gap-1 transition-colors">
          <span>View All</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
