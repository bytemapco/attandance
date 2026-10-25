"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Radio, ClipboardCheck, Clock, ArrowUpRight } from "lucide-react";

export default function TeacherQuickActions(): React.ReactElement {
  const actions = [
    {
      label: "Classes",
      href: "/teacher/classes",
      detail: "Rosters and geofences",
      icon: BookOpen,
      iconColor: "text-blue-500 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      label: "Start Session",
      href: "/teacher/sessions",
      detail: "Broadcast live attendance",
      icon: Radio,
      iconColor: "text-emerald-500 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      label: "Review Queue",
      href: "/teacher/review",
      detail: "Biometric AI audits",
      icon: ClipboardCheck,
      iconColor: "text-rose-500 dark:text-rose-400",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/20",
    },
    {
      label: "History",
      href: "/teacher/history",
      detail: "Session reports & logs",
      icon: Clock,
      iconColor: "text-purple-500 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
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
            className="flex flex-col gap-2.5 p-4 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-xl hover:border-foreground/20 hover:shadow-xs transition-all duration-200 group active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl border ${action.bgColor} ${action.borderColor} ${action.iconColor}`}>
                <Icon size={16} />
              </div>
              <ArrowUpRight
                size={14}
                className="text-muted-foreground opacity-60 group-hover:text-foreground group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
              />
            </div>
            <div>
              <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                {action.label}
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">{action.detail}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
