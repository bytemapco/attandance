"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
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

export function useNotifications(pollIntervalMs = 30000): UseNotificationsReturn {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<NotificationFilterTab>("all");
  const abortRef = useRef<AbortController | null>(null);

  const fetchNotifications = useCallback(async (tab = filterTab, targetPage = page, targetPageSize = pageSize) => {
    if (!user) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const params: Record<string, string | boolean | number> = { page: targetPage, page_size: targetPageSize };
      if (tab === "unread") params.unread_only = true;
      else if (tab !== "all") params.category = tab;

      const res = await api.get<NotificationListResponse>("/notifications", { params, signal: controller.signal });
      setNotifications(res.data.items || []);
      setUnreadCount(res.data.unread_count || 0);
      setTotalCount(res.data.total_count || 0);
      setError(null);
    } catch (err: unknown) {
      if ((err as { name?: string })?.name !== "CanceledError") {
        setError(getApiErrorMessage(err, "Failed to load notifications"));
      }
    } finally {
      setLoading(false);
    }
  }, [user, filterTab, page, pageSize]);

  useEffect(() => { void fetchNotifications(filterTab, page, pageSize); }, [fetchNotifications, filterTab, page, pageSize]);

  useEffect(() => {
    if (!user || pollIntervalMs <= 0) return;
    const interval = setInterval(() => { void fetchNotifications(filterTab, page, pageSize); }, pollIntervalMs);
    return () => clearInterval(interval);
  }, [user, pollIntervalMs, fetchNotifications, filterTab, page, pageSize]);

  useEffect(() => {
    const handleRealtime = (event: Event): void => {
      const detail = (event as CustomEvent<Record<string, unknown>>).detail;
      if (!detail) return;
      const rawType = (detail.type || detail.severity) as NotificationItem["type"] | undefined;
      const validTypes: NotificationItem["type"][] = ["info", "success", "warning", "danger", "critical"];
      const resolvedType = validTypes.includes(rawType as NotificationItem["type"]) ? rawType! : "info";

      const newItem: NotificationItem = {
        id: (detail.id as string) || `rt-${Date.now()}`,
        user_id: (detail.user_id as string | null) || null,
        role: (detail.role as string | null) || null,
        title: (detail.title as string) || "System Announcement",
        message: (detail.message as string) || "",
        type: resolvedType,
        category: (detail.category as NotificationItem["category"]) || "system",
        link: (detail.link as string | null) || null,
        is_read: false,
        created_at: (detail.created_at as string) || new Date().toISOString(),
      };
      setNotifications((prev) => [newItem, ...prev.filter((n) => n.id !== newItem.id)]);
      setUnreadCount((prev) => prev + 1);
      setTotalCount((prev) => prev + 1);
    };
    window.addEventListener("app:notification_received", handleRealtime);
    return () => window.removeEventListener("app:notification_received", handleRealtime);
  }, []);

  const markAsRead = async (id: string): Promise<void> => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try { await api.patch(`/notifications/${id}/read`); } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update notification"));
      void fetchNotifications(filterTab, page, pageSize);
    }
  };

  const markAllRead = async (): Promise<void> => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try { await api.patch("/notifications/mark-all-read"); } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to mark all as read"));
      void fetchNotifications(filterTab, page, pageSize);
    }
  };

  const deleteNotification = async (id: string): Promise<void> => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setTotalCount((prev) => Math.max(0, prev - 1));
    try { await api.delete(`/notifications/${id}`); } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete notification"));
      void fetchNotifications(filterTab, page, pageSize);
    }
  };

  const deleteSelected = async (ids: string[]): Promise<void> => {
    const idSet = new Set(ids);
    setNotifications((prev) => prev.filter((n) => !idSet.has(n.id)));
    setTotalCount((prev) => Math.max(0, prev - ids.length));
    try {
      await api.post("/notifications/bulk-delete", { ids });
      toast.success(`${ids.length} notifications deleted`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete notifications"));
      void fetchNotifications(filterTab, page, pageSize);
    }
  };

  const deleteAll = async (): Promise<void> => {
    setNotifications([]);
    setUnreadCount(0);
    setTotalCount(0);
    try {
      await api.delete("/notifications/all");
      toast.success("All notifications cleared");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to clear notifications"));
      void fetchNotifications(filterTab, page, pageSize);
    }
  };

  return {
    notifications,
    unreadCount,
    totalCount,
    loading,
    error,
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
    refetch: () => fetchNotifications(filterTab, page, pageSize),
  };
}
