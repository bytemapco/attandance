import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SwrProvider from "@/components/providers/SwrProvider";
import { useNotifications } from "@/hooks/useNotifications";
import { NOTIFICATIONS_POLL_MS } from "@/lib/polling";
import { useAuthStore } from "@/store/authStore";
import type { NotificationItem } from "@/types/notification";
import { makeUser } from "../helpers";

const { apiGet, apiPatch, toast } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

vi.mock("@/lib/api/client", () => ({ default: { get: apiGet, patch: apiPatch, post: vi.fn(), delete: vi.fn() } }));
vi.mock("react-hot-toast", () => ({ default: toast }));

function item(id: string, isRead = false): NotificationItem {
  return {
    id, user_id: "u1", role: null, title: `Title ${id}`, message: "", type: "info", category: "system",
    link: null, is_read: isRead, created_at: "2026-11-06T10:00:00Z",
  };
}

const wrapper = ({ children }: { children: React.ReactNode }) => <SwrProvider>{children}</SwrProvider>;

function listOf(items: NotificationItem[]) {
  return { data: { items, total_count: items.length, unread_count: items.filter((n) => !n.is_read).length } };
}

async function mounted() {
  const hook = renderHook(() => useNotifications(), { wrapper });
  await waitFor(() => expect(hook.result.current.notifications).toHaveLength(2));
  return hook;
}

beforeEach(() => {
  apiGet.mockReset().mockResolvedValue(listOf([item("n1"), item("n2")]));
  apiPatch.mockReset().mockResolvedValue({});
  toast.error.mockClear();
  useAuthStore.getState().login("jwt", makeUser());
});

afterEach(() => {
  vi.useRealTimers();
});

describe("notifications", () => {
  it("polls slowly: nothing for the first two minutes, then one read", async () => {
    vi.useFakeTimers();
    renderHook(() => useNotifications(), { wrapper });
    await act(async () => vi.advanceTimersByTimeAsync(0));
    expect(apiGet).toHaveBeenCalledTimes(1);

    await act(async () => vi.advanceTimersByTimeAsync(NOTIFICATIONS_POLL_MS - 1000));
    expect(apiGet).toHaveBeenCalledTimes(1);

    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(apiGet).toHaveBeenCalledTimes(2);
  });

  it("marks one as read at once, before the server answers", async () => {
    const { result } = await mounted();
    let answer: (value: unknown) => void = () => {};
    apiPatch.mockReturnValue(new Promise((resolve) => { answer = resolve; }));

    let pending: Promise<void> = Promise.resolve();
    act(() => { pending = result.current.markAsRead("n1"); });

    await waitFor(() => expect(result.current.unreadCount).toBe(1));
    expect(result.current.notifications.find((n) => n.id === "n1")?.is_read).toBe(true);
    expect(apiPatch).toHaveBeenCalledWith("/notifications/n1/read");
    await act(async () => { answer({}); await pending; });
  });

  it("puts the list back and says so when the server refuses", async () => {
    const { result } = await mounted();
    apiPatch.mockRejectedValue(new Error("nope"));

    await act(async () => { await result.current.markAsRead("n1"); });

    await waitFor(() => expect(result.current.unreadCount).toBe(2));
    expect(toast.error).toHaveBeenCalledOnce();
  });

  it("shows a notification pushed over the WebSocket without asking the server", async () => {
    const { result } = await mounted();
    apiGet.mockClear();

    act(() => {
      window.dispatchEvent(new CustomEvent("app:notification_received", { detail: { id: "rt-1", title: "Live", type: "success" } }));
    });

    await waitFor(() => expect(result.current.notifications[0].id).toBe("rt-1"));
    expect(result.current.unreadCount).toBe(3);
    expect(apiGet).not.toHaveBeenCalled();
  });
});
