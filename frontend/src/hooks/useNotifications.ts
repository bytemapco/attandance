"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import type { ApiKey } from "@/lib/api/swr";
import { NOTIFICATIONS_POLL_MS } from "@/lib/polling";
import { useAuthStore } from "@/store/authStore";
import type { NotificationItem, NotificationListResponse, NotificationFilterTab } from "@/types/notification";

interface UseNotificationsReturn {
  notifications: NotificationItem[];
  unreadCount: number;
  totalCount: number;
  loading: boolean;
  error: string | null;
  filterTab: NotificationFilterTab;
  page: number;
  pageSize: number;
  totalPages: number;
  setFilterTab: (tab: NotificationFilterTab) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteSelected: (ids: string[]) => Promise<void>;
  deleteAll: () => Promise<void>;
  refetch: () => Promise<void>;
}

function queryFor(tab: NotificationFilterTab, page: number, pageSize: number): Record<string, string | boolean | number> {
  const params: Record<string, string | boolean | number> = { page, page_size: pageSize };
  if (tab === "unread") params.unread_only = true;
  else if (tab !== "all") params.category = tab;
  return params;
}

type Change = (list: NotificationListResponse) => NotificationListResponse;

const EMPTY_LIST: NotificationListResponse = { items: [], unread_count: 0, total_count: 0 };

export function useNotifications(pollIntervalMs = NOTIFICATIONS_POLL_MS): UseNotificationsReturn {
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterTab, setFilterTab] = useState<NotificationFilterTab>("all");

  const key: ApiKey | null = user ? ["/notifications", queryFor(filterTab, page, pageSize)] : null;
  const { data, error, isLoading, mutate } = useSWR<NotificationListResponse>(key, {
    refreshInterval: pollIntervalMs,
  });

  const notifications = useMemo(() => data?.items ?? [], [data]);
  const unreadCount = data?.unread_count ?? 0;
  const totalCount = data?.total_count ?? 0;

  /**
   * Shows a change at once, then sends it. A failed write puts the list back and says so. The API client re-reads
   * the notification lists after any successful write, so the real list replaces the guess a moment later.
   * Resolves to whether the write succeeded.
   */
  const applyOptimistically = async (change: Change, write: () => Promise<unknown>, failure: string): Promise<boolean> => {
    try {
      await mutate(
        async (current) => {
          await write();
          return change(current ?? EMPTY_LIST);
        },
        { optimisticData: (current) => change(current ?? EMPTY_LIST), rollbackOnError: true, revalidate: false },
      );
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, failure));
      return false;
    }
  };

  // A pushed notification is only a signal. The server's list is the truth, so it is read again, which also keeps
  // the counts and the page right and can never show the same notification twice.
  useEffect(() => {
    const refresh = (): void => {
      void mutate();
    };
    window.addEventListener("app:notification_received", refresh);
    return () => window.removeEventListener("app:notification_received", refresh);
  }, [mutate]);

  const markAsRead = async (id: string): Promise<void> => {
    await applyOptimistically(
      (list) => ({
        ...list,
        items: list.items.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
        unread_count: Math.max(0, list.unread_count - 1),
      }),
      () => api.patch(`/notifications/${id}/read`),
      "Failed to update notification",
    );
  };

  const markAllRead = async (): Promise<void> => {
    await applyOptimistically(
      (list) => ({ ...list, items: list.items.map((n) => ({ ...n, is_read: true })), unread_count: 0 }),
      () => api.patch("/notifications/mark-all-read"),
      "Failed to mark all as read",
    );
  };

  const deleteNotification = async (id: string): Promise<void> => {
    await applyOptimistically(
      (list) => ({ ...list, items: list.items.filter((n) => n.id !== id), total_count: Math.max(0, list.total_count - 1) }),
      () => api.delete(`/notifications/${id}`),
      "Failed to delete notification",
    );
  };

  const deleteSelected = async (ids: string[]): Promise<void> => {
    const chosen = new Set(ids);
    const done = await applyOptimistically(
      (list) => ({
        ...list,
        items: list.items.filter((n) => !chosen.has(n.id)),
        total_count: Math.max(0, list.total_count - ids.length),
      }),
      () => api.post("/notifications/bulk-delete", { ids }),
      "Failed to delete notifications",
    );
    if (done) toast.success(`${ids.length} notifications deleted`);
  };

  const deleteAll = async (): Promise<void> => {
    const done = await applyOptimistically(
      (list) => ({ ...list, items: [], unread_count: 0, total_count: 0 }),
      () => api.delete("/notifications/all"),
      "Failed to clear notifications",
    );
    if (done) toast.success("All notifications cleared");
  };

  return {
    notifications,
    unreadCount,
    totalCount,
    loading: isLoading,
    error: error ? getApiErrorMessage(error, "Failed to load notifications") : null,
    filterTab,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    setFilterTab: (tab) => { setFilterTab(tab); setPage(1); },
    setPage,
    setPageSize: (size) => { setPageSize(size); setPage(1); },
    markAsRead,
    markAllRead,
    deleteNotification,
    deleteSelected,
    deleteAll,
    refetch: async () => { await mutate(); },
  };
}
