"use client";

import React from "react";
import Link from "next/link";
import { CheckCheck, RotateCw, Plus } from "lucide-react";

interface ActionButtonProps {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface NotificationHeaderProps {
  title: string;
  description: string;
  unreadCount: number;
  loading: boolean;
  onRefresh: () => void;
  onMarkAllRead: () => void;
  actionButton?: ActionButtonProps;
}

export function NotificationHeader({
  title,
  description,
  unreadCount,
  loading,
  onRefresh,
  onMarkAllRead,
  actionButton,
}: NotificationHeaderProps): React.JSX.Element {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {unreadCount > 0 ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-primary text-primary-foreground shadow-2xs">
              {unreadCount} unread
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-muted-foreground bg-secondary/80 border border-border/50">
              All caught up
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-normal">{description}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center h-8 w-8 text-xs text-muted-foreground hover:text-foreground bg-card hover:bg-secondary/70 border border-border rounded-lg transition-colors active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
          title="Refresh notifications"
          aria-label="Refresh notifications"
        >
          <RotateCw size={14} className={loading ? "animate-spin text-primary" : ""} />
        </button>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={loading}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-foreground bg-card hover:bg-secondary/70 border border-border rounded-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <CheckCheck size={14} className="text-emerald-500" />
            <span>Mark all read</span>
          </button>
        )}

        {actionButton && (
          <Link
            href={actionButton.href}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg shadow-2xs transition-all active:scale-95"
          >
            {actionButton.icon || <Plus size={14} />}
            <span>{actionButton.label}</span>
          </Link>
        )}
      </div>
    </header>
  );
}

