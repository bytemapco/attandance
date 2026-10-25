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
  attendance: { icon: <CalendarCheck size={16} />, badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", label: "Attendance" },
  leave: { icon: <FileText size={16} />, badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", label: "Leave" },
  device: { icon: <Smartphone size={16} />, badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20", label: "Device" },
  security: { icon: <ShieldAlert size={16} />, badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20", label: "Security" },
  maintenance: { icon: <Wrench size={16} />, badgeClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20", label: "Maintenance" },
  update: { icon: <Sparkles size={16} />, badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", label: "Update" },
  system: { icon: <Radio size={16} />, badgeClass: "bg-secondary text-foreground border-border/60", label: "System" },
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
          ? "bg-primary/5 border-primary/40 shadow-xs ring-1 ring-primary/20"
          : isUnread
          ? "bg-card border-border/90 shadow-2xs hover:border-border hover:shadow-xs"
          : "bg-card/50 border-border/50 opacity-80 hover:opacity-100 hover:bg-card hover:border-border"
      }`}
    >
      <div className="flex items-start gap-3.5">
        {onToggleSelect && (
          <div className="pt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(notification.id)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
              aria-label={`Select ${notification.title}`}
            />
          </div>
        )}

        <div
          className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors shadow-2xs ${categoryConfig.badgeClass}`}
        >
          {categoryConfig.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {isUnread && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
              <h3
                className={`text-sm tracking-tight truncate ${
                  isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/85"
                }`}
              >
                {notification.title}
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-secondary/80 border border-border/50 text-muted-foreground shrink-0">
                {categoryConfig.label}
              </span>
            </div>

            <time
              dateTime={notification.created_at}
              className="font-mono text-xs tabular-nums text-muted-foreground shrink-0"
            >
              {formatRelativeTime(notification.created_at)}
            </time>
          </div>

          <p className="text-xs sm:text-sm mt-1.5 leading-relaxed text-foreground/80 break-words whitespace-pre-line font-normal">
            {notification.message}
          </p>

          {notification.link && (
            <div className="mt-2.5">
              <Link
                href={notification.link}
                onClick={() => {
                  if (isUnread) void onMarkAsRead(notification.id);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <span>View action details</span>
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
              className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
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
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
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

