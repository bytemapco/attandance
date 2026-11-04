"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { adminLinks } from "./sidebarNav";

interface AdminNavSectionProps {
  unreadCount: number;
  onClose: () => void;
}

export default function AdminNavSection({ unreadCount, onClose }: AdminNavSectionProps): React.JSX.Element {
  const pathname = usePathname();

  return (
    <div>
      <p className="px-3 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        Administration
      </p>
      <div className="space-y-0.5">
        {adminLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const isNotif = link.label === "Notifications";
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all",
                isActive
                  ? "bg-accent-soft text-primary font-semibold border-l-[3px] border-accent"
                  : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className={cn(isActive ? "text-accent-strong" : "text-muted-foreground")}>{link.icon}</span>
                <span>{link.label}</span>
              </div>
              {isNotif && unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

    </div>
  );
}
