"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sliders, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminLinks, setupLinks } from "./sidebar-nav";

interface AdminNavSectionProps {
  unreadCount: number;
  onClose: () => void;
}

export default function AdminNavSection({ unreadCount, onClose }: AdminNavSectionProps): React.JSX.Element {
  const pathname = usePathname();
  const isSetupActive = pathname.startsWith("/admin/setup");
  const [userToggledSetup, setUserToggledSetup] = useState<boolean | null>(null);
  const setupOpen = userToggledSetup ?? isSetupActive;

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
                "flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors",
                isActive
                  ? "bg-secondary text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className={cn(isActive ? "text-foreground" : "text-muted-foreground")}>{link.icon}</span>
                <span>{link.label}</span>
              </div>
              {isNotif && unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground shadow-2xs">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <button
          type="button"
          onClick={() => setUserToggledSetup(!setupOpen)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
            isSetupActive ? "text-foreground font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2.5">
            <Sliders size={16} />
            <span>System Setup</span>
          </div>
          {setupOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {setupOpen && (
          <div className="pl-4 mt-1 space-y-0.5 border-l border-border ml-4">
            {setupLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors",
                    isActive ? "text-foreground font-semibold bg-secondary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
