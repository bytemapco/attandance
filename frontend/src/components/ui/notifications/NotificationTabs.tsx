"use client";

import React from "react";
import type { NotificationFilterTab } from "@/types/notification";

interface NotificationTabsProps {
  activeTab: NotificationFilterTab;
  onTabChange: (tab: NotificationFilterTab) => void;
  unreadCount: number;
}

const TABS: { id: NotificationFilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "attendance", label: "Attendance" },
  { id: "system", label: "System" },
];

export default function NotificationTabs({
  activeTab,
  onTabChange,
  unreadCount,
}: NotificationTabsProps): React.ReactElement {
  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-secondary/10 overflow-x-auto no-scrollbar">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all shrink-0 flex items-center gap-1.5 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <span>{tab.label}</span>
            {tab.id === "unread" && unreadCount > 0 && (
              <span
                className={`px-1 py-0.2 rounded-full text-[9px] font-bold ${
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary/15 text-primary"
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
