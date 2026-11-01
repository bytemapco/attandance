"use client";

import React from "react";
import Link from "next/link";
import { KeyRound, BookOpen, QrCode, ArrowUpRight } from "lucide-react";

interface QuickActionItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export default function AdminQuickActions(): React.ReactElement {
  const quickActions: QuickActionItem[] = [
    {
      label: "Manage Licenses",
      href: "/admin/licenses",
      icon: <KeyRound size={18} className="text-[#306b8a]" />,
    },
    {
      label: "Class Schedules",
      href: "/admin/classes",
      icon: <BookOpen size={18} className="text-[#526f78]" />,
    },
    {
      label: "Attendance Scanner",
      href: "/admin/scanner",
      icon: <QrCode size={18} className="text-[#c98260]" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {quickActions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="relative overflow-hidden flex flex-col justify-between p-4.5 rounded-xl border border-[#e3e1dc] bg-card shadow-[0_2px_8px_rgba(40,54,59,0.04)] hover:border-[#c98260]/60 hover:shadow-[0_4px_16px_rgba(40,54,59,0.07)] transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-secondary border border-[#e3e1dc] transition-transform group-hover:scale-105">
              {action.icon}
            </div>
            <ArrowUpRight
              size={14}
              className="text-[#718087] transition-all duration-200 group-hover:text-[#c98260] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </div>

          <div>
            <h3 className="font-bold text-xs text-[#202b30] tracking-normal group-hover:text-[#28363b]">
              {action.label}
            </h3>
          </div>
        </Link>
      ))}
    </div>
  );
}
