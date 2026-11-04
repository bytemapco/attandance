"use client";

import React from "react";
import Link from "next/link";
import { CheckCheck, RotateCw, Plus } from "lucide-react";
import Button from "@/components/ui/Button";

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
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary">
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
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50 cursor-pointer"
          title="Refresh notifications"
          aria-label="Refresh notifications"
        >
          <RotateCw size={14} className={loading ? "animate-spin" : ""} />
        </button>

        {unreadCount > 0 && (
          <Button variant="secondary" icon={<CheckCheck size={14} />} onClick={onMarkAllRead} disabled={loading}>
            Mark all read
          </Button>
        )}

        {actionButton && (
          <Link
            href={actionButton.href}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            {actionButton.icon || <Plus size={14} />}
            <span>{actionButton.label}</span>
          </Link>
        )}
      </div>
    </header>
  );
}

