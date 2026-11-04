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
      <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground">
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
                "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className={cn(isActive ? "text-accent-strong" : "text-muted-foreground")}>{link.icon}</span>
                <span>{link.label}</span>
              </div>
              {isNotif && unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
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
