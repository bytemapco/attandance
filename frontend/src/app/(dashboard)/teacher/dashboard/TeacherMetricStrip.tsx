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
      iconColor: "text-[#526f78]",
      bgColor: "bg-[#eeece7]",
      borderColor: "border-[#e3e1dc]",
    },
    {
      label: "Active Sessions",
      value: activeSessionCount,
      href: "/teacher/sessions",
      icon: Radio,
      iconColor: activeSessionCount > 0 ? "text-[#247653]" : "text-[#526f78]",
      bgColor: activeSessionCount > 0 ? "bg-[#e8f3ed]" : "bg-[#eeece7]",
      borderColor: activeSessionCount > 0 ? "border-[#c6e2d3]" : "border-[#e3e1dc]",
    },
    {
      label: "Flagged Attendance",
      value: flaggedCount,
      href: "/teacher/review",
      icon: ShieldAlert,
      iconColor: flaggedCount > 0 ? "text-[#8a5b12]" : "text-[#526f78]",
      bgColor: flaggedCount > 0 ? "bg-[#fbf1df]" : "bg-[#eeece7]",
      borderColor: flaggedCount > 0 ? "border-[#f2deba]" : "border-[#e3e1dc]",
    },
    {
      label: "Leave Requests",
      value: pendingLeaveCount,
      href: "/teacher/leaves",
      icon: CalendarClock,
      iconColor: pendingLeaveCount > 0 ? "text-[#306b8a]" : "text-[#526f78]",
      bgColor: pendingLeaveCount > 0 ? "bg-[#eaf2f6]" : "bg-[#eeece7]",
      borderColor: pendingLeaveCount > 0 ? "border-[#c5dce8]" : "border-[#e3e1dc]",
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
            className="group relative overflow-hidden rounded-xl border border-[#e3e1dc] p-4 sm:p-5 bg-card transition-all duration-200 hover:border-[#c98260]/60 hover:shadow-[0_4px_16px_rgba(40,54,59,0.06)] active:scale-[0.99]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#202b30] font-mono tabular-nums">
                {item.value}
              </span>
              <div className={`p-2 rounded-xl border shrink-0 ${item.bgColor} ${item.borderColor}`}>
                <Icon size={16} className={item.iconColor} />
              </div>
            </div>

            <p className="mt-2 text-xs font-semibold text-[#526f78] uppercase tracking-wider truncate">
              {item.label}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
