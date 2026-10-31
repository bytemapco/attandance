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
      <p className="px-3 mb-2 text-[10px] font-bold text-[#526f78] uppercase tracking-wider">
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
                  ? "bg-[#f7efea] text-[#28363b] font-semibold border-l-[3px] border-[#c98260] shadow-2xs"
                  : "text-[#526f78] hover:bg-secondary/70 hover:text-[#202b30]"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className={cn(isActive ? "text-[#c98260]" : "text-[#526f78]")}>{link.icon}</span>
                <span>{link.label}</span>
              </div>
              {isNotifLink && unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1.5 rounded-full text-[10px] font-bold bg-[#28363b] text-white shadow-2xs">
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
