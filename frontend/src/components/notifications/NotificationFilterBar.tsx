"use client";

import React from "react";
import { Search, X, Inbox, Clock, CalendarCheck, FileText, ShieldAlert, Radio, Sparkles } from "lucide-react";
import type { NotificationFilterTab } from "@/types/notification";

interface NotificationFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  activeFilter: NotificationFilterTab;
  onFilterChange: (filter: NotificationFilterTab) => void;
  unreadCount?: number;
}

const FILTER_ITEMS: { id: NotificationFilterTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "all", label: "All", icon: Inbox },
  { id: "unread", label: "Unread", icon: Clock },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "leave", label: "Leaves", icon: FileText },
  { id: "security", label: "Security", icon: ShieldAlert },
  { id: "system", label: "System", icon: Radio },
  { id: "update", label: "Updates", icon: Sparkles },
];

export function NotificationFilterBar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  unreadCount = 0,
}: NotificationFilterBarProps): React.JSX.Element {
  return (
    <div className="space-y-3">
      <div className="relative w-full">
        <Search
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#718087] pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search notifications..."
          className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-card border border-[#e3e1dc] rounded-lg text-[#202b30] placeholder:text-[#718087] focus:outline-none focus:ring-1 focus:ring-[#28363b] focus:border-[#28363b] transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718087] hover:text-[#202b30] p-0.5 rounded cursor-pointer"
            title="Clear search"
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <nav aria-label="Notification filters" className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {FILTER_ITEMS.map((item) => {
          const isActive = activeFilter === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilterChange(item.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all shrink-0 cursor-pointer select-none active:scale-95 ${
                isActive
                  ? "bg-[#28363b] text-white font-semibold shadow-xs"
                  : "bg-card text-[#526f78] hover:text-[#202b30] hover:bg-[#eeece7] border border-[#e3e1dc] font-medium"
              }`}
            >
              <Icon size={13} className={isActive ? "text-white" : "text-[#718087]"} />
              <span>{item.label}</span>
              {item.id === "unread" && unreadCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                    isActive ? "bg-white text-[#28363b]" : "bg-[#c98260] text-white"
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

