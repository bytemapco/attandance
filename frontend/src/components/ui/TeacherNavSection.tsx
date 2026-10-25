"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { teacherLinks, teacherReportLinks } from "./sidebar-nav";

interface TeacherNavSectionProps {
  unreadCount: number;
  onClose: () => void;
}

export default function TeacherNavSection({ unreadCount, onClose }: TeacherNavSectionProps): React.JSX.Element {
  const pathname = usePathname();
  const [flaggedCount, setFlaggedCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchFlagged = async () => {
      try {
        const { data } = await api.get<unknown[]>("/teacher/attendance/flagged");
        if (isMounted) setFlaggedCount(Array.isArray(data) ? data.length : 0);
      } catch { /* Polling error ignored */ }
    };
    void fetchFlagged();
    const interval = setInterval(() => void fetchFlagged(), 60_000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  return (
    <>
      <div>
        <p className="px-3 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Teaching Operations
        </p>
        <div className="space-y-0.5">
          {teacherLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const isReviewLink = link.href === "/teacher/review";
            const isNotif = link.label === "Notifications";
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors",
                  isActive ? "bg-secondary text-foreground font-semibold shadow-2xs" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className={cn(isActive ? "text-foreground" : "text-muted-foreground")}>{link.icon}</span>
                  <span>{link.label}</span>
                </div>
                {isReviewLink && flaggedCount > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {flaggedCount > 99 ? "99+" : flaggedCount}
                  </span>
                )}
                {isNotif && unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground shadow-2xs">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <p className="px-3 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Analytics & Reports
        </p>
        <div className="space-y-0.5">
          {teacherReportLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                  isActive ? "bg-secondary text-foreground font-semibold shadow-2xs" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className={cn(isActive ? "text-foreground" : "text-muted-foreground")}>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
