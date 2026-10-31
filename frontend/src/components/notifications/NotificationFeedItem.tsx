"use client";

import React from "react";
import Link from "next/link";
import {
  CalendarCheck,
  FileText,
  Smartphone,
  ShieldAlert,
  Radio,
  Wrench,
  Sparkles,
  ArrowUpRight,
  Check,
  Trash2,
} from "lucide-react";
import type { NotificationItem, NotificationCategory } from "@/types/notification";

interface NotificationFeedItemProps {
  notification: NotificationItem;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const CATEGORY_MAP: Record<NotificationCategory, { icon: React.ReactNode; badgeClass: string; label: string }> = {
  attendance: {
    icon: <CalendarCheck size={16} />,
    badgeClass: "bg-[#e8f3ed] text-[#247653] border-[#247653]/30",
    label: "Attendance",
  },
  leave: {
    icon: <FileText size={16} />,
    badgeClass: "bg-[#fbf1df] text-[#8a5b12] border-[#8a5b12]/30",
    label: "Leave",
  },
  device: {
    icon: <Smartphone size={16} />,
    badgeClass: "bg-[#eaf2f6] text-[#306b8a] border-[#306b8a]/30",
    label: "Hardware",
  },
  security: {
    icon: <ShieldAlert size={16} />,
    badgeClass: "bg-[#f9eaea] text-[#b54242] border-[#b54242]/30",
    label: "Security",
  },
  maintenance: {
    icon: <Wrench size={16} />,
    badgeClass: "bg-[#fbf1df] text-[#8a5b12] border-[#8a5b12]/30",
    label: "Maintenance",
  },
  update: {
    icon: <Sparkles size={16} />,
    badgeClass: "bg-[#eeece7] text-[#28363b] border-[#e3e1dc]",
    label: "Update",
  },
  system: {
    icon: <Radio size={16} />,
    badgeClass: "bg-[#eeece7] text-[#526f78] border-[#e3e1dc]",
    label: "System",
  },
};

function getCategoryConfig(category: NotificationCategory) {
  return CATEGORY_MAP[category] || CATEGORY_MAP.system;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return d.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

export function NotificationFeedItem({
  notification,
  isSelected = false,
  onToggleSelect,
  onMarkAsRead,
  onDelete,
}: NotificationFeedItemProps): React.JSX.Element {
  const isUnread = !notification.is_read;
  const categoryConfig = getCategoryConfig(notification.category);

  return (
    <div
      className={`group relative p-4 rounded-xl border transition-all duration-150 ${
        isSelected
          ? "bg-[#eeece7]/40 border-[#28363b]/40 ring-1 ring-[#28363b]/20"
          : isUnread
          ? "bg-card border-[#e3e1dc] shadow-xs hover:border-[#28363b]/30"
          : "bg-card/60 border-[#e3e1dc]/70 opacity-85 hover:opacity-100 hover:bg-card hover:border-[#e3e1dc]"
      }`}
    >
      <div className="flex items-start gap-3.5">
        {onToggleSelect && (
          <div className="pt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(notification.id)}
              className="h-4 w-4 rounded border-[#e3e1dc] text-[#28363b] focus:ring-[#28363b] cursor-pointer accent-[#28363b]"
              aria-label={`Select ${notification.title}`}
            />
          </div>
        )}

        <div
          className={`h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${categoryConfig.badgeClass}`}
        >
          {categoryConfig.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {isUnread && <span className="h-2 w-2 rounded-full bg-[#c98260] shrink-0" />}
              <h3
                className={`text-sm tracking-tight truncate ${
                  isUnread ? "font-semibold text-[#202b30]" : "font-medium text-[#202b30]/85"
                }`}
              >
                {notification.title}
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#eeece7] border border-[#e3e1dc] text-[#526f78] shrink-0">
                {categoryConfig.label}
              </span>
            </div>

            <time
              dateTime={notification.created_at}
              className="font-mono text-xs tabular-nums text-[#718087] shrink-0"
            >
              {formatRelativeTime(notification.created_at)}
            </time>
          </div>

          <p className="text-xs sm:text-sm mt-1.5 leading-relaxed text-[#526f78] break-words whitespace-pre-line font-normal">
            {notification.message}
          </p>

          {notification.link && (
            <div className="mt-2.5">
              <Link
                href={notification.link}
                onClick={() => {
                  if (isUnread) void onMarkAsRead(notification.id);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#28363b] hover:text-[#c98260] transition-colors"
              >
                <span>View details</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 pt-0.5">
          {isUnread && (
            <button
              type="button"
              onClick={() => void onMarkAsRead(notification.id)}
              className="p-1.5 rounded-lg text-[#718087] hover:text-[#247653] hover:bg-[#e8f3ed] transition-colors cursor-pointer"
              title="Mark as read"
              aria-label="Mark as read"
            >
              <Check size={14} />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => void onDelete(notification.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#718087] hover:text-[#b54242] hover:bg-[#f9eaea] transition-all cursor-pointer"
              title="Delete notification"
              aria-label="Delete notification"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

