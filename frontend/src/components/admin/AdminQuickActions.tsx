"use client";

import React from "react";
import Link from "next/link";
import { KeyRound, BookOpen, QrCode, ArrowUpRight } from "lucide-react";

interface QuickActionItem {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

export default function AdminQuickActions(): React.ReactElement {
  const quickActions: QuickActionItem[] = [
    {
      label: "Manage Licenses",
      description: "Check available seats and requests.",
      href: "/admin/licenses",
      icon: <KeyRound size={18} className="text-info" />,
    },
    {
      label: "Class Schedules",
      description: "Review classes and their schedules.",
      href: "/admin/class-management",
      icon: <BookOpen size={18} className="text-muted-foreground" />,
    },
    {
      label: "Attendance Scanner",
      description: "Open the attendance scanner.",
      href: "/admin/scanner",
      icon: <QrCode size={18} className="text-accent-strong" />,
    },
  ];

  return (
    <nav aria-label="Quick actions" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {quickActions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="group flex min-h-28 items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors duration-150 hover:border-accent/60 hover:bg-background/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-foreground"
        >
          <div className="mt-0.5 rounded-lg border border-border bg-secondary p-2.5">
            {action.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
              {action.label}
              <ArrowUpRight size={15} aria-hidden className="shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-strong" />
            </h3>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{action.description}</p>
          </div>
        </Link>
      ))}
    </nav>
  );
}
