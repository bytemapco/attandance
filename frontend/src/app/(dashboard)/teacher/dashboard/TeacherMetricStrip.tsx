"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Radio, ShieldAlert, CalendarClock } from "lucide-react";

interface TeacherMetricStripProps {
  classCount: number;
  activeSessionCount: number;
  flaggedCount: number;
  pendingLeaveCount: number;
}

export default function TeacherMetricStrip({
  classCount,
  activeSessionCount,
  flaggedCount,
  pendingLeaveCount,
}: TeacherMetricStripProps): React.ReactElement {
  const metrics = [
    {
      label: "Classes",
      value: classCount,
      href: "/teacher/classes",
      icon: BookOpen,
      iconColor: "text-blue-500 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      description: "Active classes",
    },
    {
      label: "Live Sessions",
      value: activeSessionCount,
      href: "/teacher/sessions",
      icon: Radio,
      iconColor: activeSessionCount > 0 ? "text-emerald-500 dark:text-emerald-400" : "text-muted-foreground",
      bgColor: activeSessionCount > 0 ? "bg-emerald-500/10" : "bg-muted/50",
      borderColor: activeSessionCount > 0 ? "border-emerald-500/25" : "border-border/60",
      description: activeSessionCount > 0 ? "In progress" : "No active session",
    },
    {
      label: "Flagged Records",
      value: flaggedCount,
      href: "/teacher/review",
      icon: ShieldAlert,
      iconColor: flaggedCount > 0 ? "text-rose-500 dark:text-rose-400" : "text-muted-foreground",
      bgColor: flaggedCount > 0 ? "bg-rose-500/10" : "bg-muted/50",
      borderColor: flaggedCount > 0 ? "border-rose-500/25" : "border-border/60",
      description: flaggedCount > 0 ? "Needs review" : "All clear",
    },
    {
      label: "Leave Requests",
      value: pendingLeaveCount,
      href: "/teacher/leaves",
      icon: CalendarClock,
      iconColor: pendingLeaveCount > 0 ? "text-amber-500 dark:text-amber-400" : "text-muted-foreground",
      bgColor: pendingLeaveCount > 0 ? "bg-amber-500/10" : "bg-muted/50",
      borderColor: pendingLeaveCount > 0 ? "border-amber-500/25" : "border-border/60",
      description: pendingLeaveCount > 0 ? "Pending approval" : "All clear",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {metrics.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`group relative overflow-hidden rounded-2xl border p-4 sm:p-5 bg-card/80 backdrop-blur-xl transition-all duration-200 hover:border-foreground/25 hover:shadow-sm active:scale-[0.99] ${item.borderColor}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-muted-foreground truncate">
                {item.label}
              </span>
              <div className={`p-2 rounded-xl border shrink-0 ${item.bgColor} ${item.borderColor}`}>
                <Icon size={16} className={item.iconColor} />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono tabular-nums">
                {item.value}
              </span>
            </div>

            <p className="mt-1 text-[11px] text-muted-foreground truncate">
              {item.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
