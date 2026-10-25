"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Activity, BookOpen, Cpu, ArrowUpRight } from "lucide-react";

interface QuickActionItem {
  label: string;
  href: string;
  detail: string;
  icon: React.ReactNode;
  accent: string;
}

export default function AdminQuickActions(): React.ReactElement {
  const quickActions: QuickActionItem[] = [
    {
      label: "Verification Settings",
      href: "/admin/setup/verification-settings",
      detail: "Camera and location rules",
      icon: <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />,
      accent: "hover:border-emerald-500/40 hover:bg-emerald-500/5",
    },
    {
      label: "Activity Log",
      href: "/admin/audit",
      detail: "System logs and events",
      icon: <Activity size={18} className="text-sky-600 dark:text-sky-400" />,
      accent: "hover:border-sky-500/40 hover:bg-sky-500/5",
    },
    {
      label: "Classes",
      href: "/admin/classes",
      detail: "Schedules and student rosters",
      icon: <BookOpen size={18} className="text-indigo-600 dark:text-indigo-400" />,
      accent: "hover:border-indigo-500/40 hover:bg-indigo-500/5",
    },
    {
      label: "Attendance Scanner",
      href: "/admin/scanner",
      detail: "Flag irregular attendance",
      icon: <Cpu size={18} className="text-purple-600 dark:text-purple-400" />,
      accent: "hover:border-purple-500/40 hover:bg-purple-500/5",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {quickActions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={`relative overflow-hidden flex flex-col justify-between p-4.5 rounded-xl border border-border bg-card shadow-xs hover:shadow-md transition-all duration-200 group ${action.accent}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-secondary/80 border border-border/60 transition-transform group-hover:scale-105">
              {action.icon}
            </div>
            <ArrowUpRight
              size={14}
              className="text-muted-foreground transition-all duration-200 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-xs text-foreground tracking-normal group-hover:text-primary">
              {action.label}
            </h3>
            <p className="text-[11px] text-muted-foreground font-normal leading-relaxed">
              {action.detail}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
