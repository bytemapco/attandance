"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { superAdminLinks } from "./sidebarNav";
import { useNotifications } from "@/hooks/useNotifications";

interface SuperAdminNavSectionProps {
  onClose: () => void;
}

export default function SuperAdminNavSection({ onClose }: SuperAdminNavSectionProps): React.ReactElement {
  const pathname = usePathname();
  const { unreadCount } = useNotifications(25000);

  return (
    <div>
      <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground">
        Platform
      </p>
      <div className="space-y-0.5">
        {superAdminLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const isNotifLink = link.label === "Notifications";
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
              {isNotifLink && unreadCount > 0 && (
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
