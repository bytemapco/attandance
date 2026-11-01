"use client";

import React, { useState } from "react";
import { Inbox, AlertCircle, RotateCw, Trash2, X } from "lucide-react";
import { NotificationFeedItem } from "./NotificationFeedItem";
import GlassConfirmDialog from "@/components/ui/GlassConfirmDialog";
import type { NotificationItem } from "@/types/notification";
import { Skeleton } from "@/components/ui/Skeleton";

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
      <div className="space-y-3" role="status" aria-label="Loading notifications" aria-busy="true">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-4">
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <div className="p-8 rounded-xl bg-[#f9eaea] border border-[#b54242]/20 text-center space-y-3">
        <div className="inline-flex p-3 rounded-lg bg-[#b54242]/10 text-[#b54242]"><AlertCircle size={22} /></div>
        <h3 className="text-base font-semibold text-[#202b30]">Unable to load notifications</h3>
        <p className="text-xs sm:text-sm text-[#526f78] max-w-sm mx-auto">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#b54242] hover:bg-[#a03838] rounded-lg transition-all active:scale-95 cursor-pointer shadow-xs"
        >
          <RotateCw size={13} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-12 rounded-xl bg-card border border-[#e3e1dc] text-center space-y-3">
        <div className="inline-flex p-3.5 rounded-xl bg-[#eeece7] text-[#526f78] border border-[#e3e1dc]"><Inbox size={24} /></div>
        <h3 className="text-base font-semibold text-[#202b30]">{searchQuery ? "No matching notifications" : "Inbox zero"}</h3>
        <p className="text-xs sm:text-sm text-[#526f78] max-w-md mx-auto leading-relaxed">
          {searchQuery ? `No alerts match "${searchQuery}". Check spelling or switch filter tabs.` : "You have reviewed all platform alerts. New campus activities will appear here in real time."}
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
      <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-card border border-[#e3e1dc] rounded-lg text-xs">
        <div className="flex items-center gap-3">
          {onSelectAll && (
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onSelectAll}
                className="h-4 w-4 rounded border-[#e3e1dc] text-[#28363b] focus:ring-[#28363b] cursor-pointer accent-[#28363b]"
              />
              <span className="text-[#526f78] font-semibold">
                {selectedCount > 0 ? `${selectedCount} selected` : "Select all"}
              </span>
            </label>
          )}

          {selectedCount > 0 && onClearSelection && (
            <button
              type="button"
              onClick={onClearSelection}
              className="inline-flex items-center gap-1 text-[#718087] hover:text-[#202b30] transition-colors cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#b54242] bg-[#f9eaea] hover:bg-[#f9eaea]/80 rounded-md transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete ({selectedCount})</span>
            </button>
          )}

          {onDeleteAll && (
            <button
              type="button"
              onClick={() => setConfirmDeleteAllOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#718087] hover:text-[#b54242] hover:bg-[#f9eaea] rounded-md transition-all cursor-pointer"
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

