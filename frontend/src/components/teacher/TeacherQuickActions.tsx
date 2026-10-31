"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, CalendarCheck, CalendarDays, ClipboardCheck, ArrowUpRight } from "lucide-react";

export default function TeacherQuickActions(): React.ReactElement {
  const actions = [
    {
      label: "Today's Schedule",
      href: "/teacher/today",
      icon: CalendarCheck,
      iconColor: "text-[#247653]",
      bgColor: "bg-[#e8f3ed]",
      borderColor: "border-[#c6e2d3]",
    },
    {
      label: "Weekly Timetable",
      href: "/teacher/timetable",
      icon: CalendarDays,
      iconColor: "text-[#c98260]",
      bgColor: "bg-[#fdf4ed]",
      borderColor: "border-[#f2d8c9]",
    },
    {
      label: "Classes & Rosters",
      href: "/teacher/classes",
      icon: BookOpen,
      iconColor: "text-[#526f78]",
      bgColor: "bg-[#eeece7]",
      borderColor: "border-[#e3e1dc]",
    },
    {
      label: "Review Attendance",
      href: "/teacher/review",
      icon: ClipboardCheck,
      iconColor: "text-[#8a5b12]",
      bgColor: "bg-[#fbf1df]",
      borderColor: "border-[#f2deba]",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col gap-2.5 p-4 rounded-xl border border-[#e3e1dc] bg-card hover:border-[#c98260]/60 hover:shadow-[0_4px_14px_rgba(40,54,59,0.06)] transition-all duration-200 group active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl border ${action.bgColor} ${action.borderColor} ${action.iconColor}`}>
                <Icon size={16} />
              </div>
              <ArrowUpRight
                size={14}
                className="text-[#718087] group-hover:text-[#c98260] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
              />
            </div>
            <div>
              <span className="font-bold text-xs text-[#202b30] group-hover:text-[#28363b] transition-colors">
                {action.label}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
