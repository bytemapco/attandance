"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  Calendar,
  Radio,
  Trash2,
  ExternalLink,
} from "lucide-react";
import type { NotificationItem } from "@/types/notification";

interface NotificationItemRowProps {
  notification: NotificationItem;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClosePopover: () => void;
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  if (diffMs < 0 || isNaN(diffMs)) return "Just now";
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getIcon(type: string, category: string) {
  if (category === "leave") {
    return <Calendar size={13} className="text-amber-500" />;
  }
  if (category === "maintenance" || category === "attendance" || type === "warning") {
    return <AlertTriangle size={13} className="text-amber-500" />;
  }
  if (type === "danger" || type === "critical" || category === "security") {
    return <ShieldAlert size={13} className="text-rose-500" />;
  }
  if (type === "success" || category === "update") {
    return <CheckCircle2 size={13} className="text-emerald-500" />;
  }
  if (category === "device") {
    return <Radio size={13} className="text-sky-500" />;
  }
  return <Info size={13} className="text-sky-500" />;
}

export default function NotificationItemRow({
  notification,
  onMarkRead,
  onDelete,
  onClosePopover,
}: NotificationItemRowProps): React.ReactElement {
  const { id, title, message, type, category, link, is_read, created_at } = notification;

  const handleClick = () => {
    if (!is_read) {
      onMarkRead(id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative p-3 transition-colors flex gap-2.5 cursor-pointer select-none hover:bg-secondary/40 ${
        is_read ? "opacity-75 bg-transparent" : "bg-primary/5"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        <div className="p-1 rounded-md bg-secondary/80 border border-border/60">
          {getIcon(type, category)}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {!is_read && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            )}
            <p className="text-xs font-semibold text-foreground truncate">{title}</p>
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatRelativeTime(created_at)}
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
          {message}
        </p>

        {link && (
          <div className="mt-1.5 flex items-center gap-2">
            <Link
              href={link}
              onClick={(e) => {
                e.stopPropagation();
                if (!is_read) onMarkRead(id);
                onClosePopover();
              }}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
            >
              <span>View details</span>
              <ExternalLink size={10} />
            </Link>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(id);
        }}
        aria-label="Delete notification"
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-rose-500 rounded hover:bg-secondary shrink-0 h-fit"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
