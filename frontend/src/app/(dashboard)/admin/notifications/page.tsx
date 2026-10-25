"use client";

import React, { useState, useMemo } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { useDebounce } from "@/hooks/useDebounce";
import { NotificationHeader } from "@/components/notifications/NotificationHeader";
import { NotificationFilterBar } from "@/components/notifications/NotificationFilterBar";
import { NotificationFeedList } from "@/components/notifications/NotificationFeedList";
import EnterprisePagination from "@/components/ui/EnterprisePagination";

export default function AdminNotificationsPage(): React.JSX.Element {
  const {
    notifications,
    unreadCount,
    totalCount,
    loading,
    error,
    filterTab,
    page,
    pageSize,
    setFilterTab,
    setPage,
    setPageSize,
    markAsRead,
    markAllRead,
    deleteNotification,
    deleteSelected,
    deleteAll,
    refetch,
  } = useNotifications(20000);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebounce(searchQuery, 300);

  const filteredNotifications = useMemo(() => {
    if (!debouncedSearch.trim()) return notifications;
    const q = debouncedSearch.toLowerCase();
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q)
    );
  }, [notifications, debouncedSearch]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const allSelected = filteredNotifications.length > 0 && filteredNotifications.every((n) => selectedIds.has(n.id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  const handleDeleteSelected = async () => {
    await deleteSelected(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleDeleteAll = async () => {
    await deleteAll();
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <NotificationHeader
        title="Notifications"
        description="System alerts and campus notices."
        unreadCount={unreadCount}
        loading={loading}
        onRefresh={() => void refetch()}
        onMarkAllRead={() => void markAllRead()}
        actionButton={{
          label: "New Announcement",
          href: "/admin/notifications/broadcast",
        }}
      />

      <NotificationFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={filterTab}
        onFilterChange={setFilterTab}
        unreadCount={unreadCount}
      />

      <div className="space-y-4">
        <NotificationFeedList
          notifications={filteredNotifications}
          loading={loading}
          error={error}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onClearSelection={() => setSelectedIds(new Set())}
          onDeleteSelected={handleDeleteSelected}
          onDeleteAll={handleDeleteAll}
          onRetry={() => void refetch()}
          onMarkAsRead={markAsRead}
          onDelete={deleteNotification}
          searchQuery={debouncedSearch}
        />

        {!loading && totalCount > pageSize && (
          <EnterprisePagination
            totalItems={totalCount}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemName="notifications"
          />
        )}
      </div>
    </div>
  );
}
