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
  description?: string;
  unreadCount: number;
  loading: boolean;
  onRefresh: () => void;
  onMarkAllRead: () => void;
  actionButton?: ActionButtonProps;
}

export function NotificationHeader({
  title,
  unreadCount,
  loading,
  onRefresh,
  onMarkAllRead,
  actionButton,
}: NotificationHeaderProps): React.JSX.Element {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
          {title}
        </h1>
        {unreadCount > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-accent text-primary-foreground">
            {unreadCount} unread
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center h-9 w-9 text-xs text-muted-foreground hover:text-foreground bg-card hover:bg-secondary border border-border rounded-lg transition-colors active:scale-95 disabled:opacity-50 cursor-pointer"
          title="Refresh notifications"
          aria-label="Refresh notifications"
        >
          <RotateCw size={14} className={loading ? "animate-spin text-accent-strong" : ""} />
        </button>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={loading}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-foreground bg-card hover:bg-secondary border border-border rounded-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <CheckCheck size={14} className="text-success" />
            <span>Mark all read</span>
          </button>
        )}

        {actionButton && (
          <Link
            href={actionButton.href}
            className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-semibold text-primary-foreground bg-primary hover:bg-foreground rounded-lg transition-all active:scale-95 shadow-sm"
          >
            {actionButton.icon || <Plus size={14} />}
            <span>{actionButton.label}</span>
          </Link>
        )}
      </div>
    </header>
  );
}

