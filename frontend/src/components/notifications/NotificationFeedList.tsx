"use client";

import React, { useState } from "react";
import { Inbox, AlertCircle, RotateCw, Trash2, X } from "lucide-react";
import { NotificationFeedItem } from "./NotificationFeedItem";
import GlassConfirmDialog from "@/components/ui/GlassConfirmDialog";
import type { NotificationItem } from "@/types/notification";

interface NotificationFeedListProps {
  notifications: NotificationItem[];
  loading: boolean;
  error: string | null;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onDeleteSelected?: () => Promise<void>;
  onDeleteAll?: () => Promise<void>;
  onRetry: () => void;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  searchQuery?: string;
}

export function NotificationFeedList({
  notifications,
  loading,
  error,
  selectedIds = new Set(),
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onDeleteAll,
  onRetry,
  onMarkAsRead,
  onDelete,
  searchQuery,
}: NotificationFeedListProps): React.JSX.Element {
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);
  const [confirmDeleteSelectedOpen, setConfirmDeleteSelectedOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (loading && notifications.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-card border border-border animate-pulse flex items-start gap-3.5">
            <div className="h-9 w-9 rounded-xl bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="w-32 h-3.5 bg-muted rounded" />
              <div className="w-3/4 h-3 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-destructive/5 border border-destructive/20 text-center space-y-3">
        <div className="inline-flex p-3 rounded-xl bg-destructive/10 text-destructive"><AlertCircle size={24} /></div>
        <h3 className="text-base font-semibold text-foreground">Unable to load notifications</h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">{error}</p>
        <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-destructive hover:bg-destructive/90 rounded-lg transition-all active:scale-95 cursor-pointer shadow-2xs">
          <RotateCw size={13} /><span>Retry</span>
        </button>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-12 rounded-2xl bg-card/60 backdrop-blur-md border border-border/80 text-center space-y-3 shadow-2xs">
        <div className="inline-flex p-3.5 rounded-2xl bg-secondary/80 text-muted-foreground border border-border/40"><Inbox size={26} /></div>
        <h3 className="text-base font-semibold text-foreground">{searchQuery ? "No matching notifications" : "Inbox zero"}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          {searchQuery ? `No alerts match "${searchQuery}". Check spelling or switch filter tabs.` : "You have reviewed all platform alerts. New campus activities and triggers will appear here in real time."}
        </p>
      </div>
    );
  }

  const allSelected = notifications.length > 0 && notifications.every((n) => selectedIds.has(n.id));
  const selectedCount = selectedIds.size;

  const handleDeleteSelected = async () => {
    if (!onDeleteSelected) return;
    setDeleting(true);
    try { await onDeleteSelected(); setConfirmDeleteSelectedOpen(false); } finally { setDeleting(false); }
  };

  const handleDeleteAll = async () => {
    if (!onDeleteAll) return;
    setDeleting(true);
    try { await onDeleteAll(); setConfirmDeleteAllOpen(false); } finally { setDeleting(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 bg-card/70 backdrop-blur-md border border-border/80 rounded-xl text-xs shadow-2xs">
        <div className="flex items-center gap-3">
          {onSelectAll && (
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onSelectAll}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
              />
              <span className="text-muted-foreground font-medium">
                {selectedCount > 0 ? `${selectedCount} selected` : "Select all"}
              </span>
            </label>
          )}

          {selectedCount > 0 && onClearSelection && (
            <button
              type="button"
              onClick={onClearSelection}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X size={12} />
              <span>Clear</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedCount > 0 && onDeleteSelected && (
            <button
              type="button"
              onClick={() => setConfirmDeleteSelectedOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-destructive bg-destructive/10 hover:bg-destructive/15 rounded-lg transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete ({selectedCount})</span>
            </button>
          )}

          {onDeleteAll && (
            <button
              type="button"
              onClick={() => setConfirmDeleteAllOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete all</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        {notifications.map((notification) => (
          <NotificationFeedItem
            key={notification.id}
            notification={notification}
            isSelected={selectedIds.has(notification.id)}
            onToggleSelect={onToggleSelect}
            onMarkAsRead={onMarkAsRead}
            onDelete={onDelete}
          />
        ))}
      </div>

      <GlassConfirmDialog
        isOpen={confirmDeleteSelectedOpen}
        title="Delete Selected Notifications"
        message={`Delete ${selectedCount} selected notification(s)? This action cannot be undone.`}
        confirmLabel="Delete Selected"
        onConfirm={() => void handleDeleteSelected()}
        onCancel={() => setConfirmDeleteSelectedOpen(false)}
        loading={deleting}
      />
      <GlassConfirmDialog
        isOpen={confirmDeleteAllOpen}
        title="Delete All Notifications"
        message="Clear all notifications from your feed? This action cannot be undone."
        confirmLabel="Delete All"
        onConfirm={() => void handleDeleteAll()}
        onCancel={() => setConfirmDeleteAllOpen(false)}
        loading={deleting}
      />
    </div>
  );
}

