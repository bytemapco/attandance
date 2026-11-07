import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SWRConfig } from "swr";
import { usePlatformWebSocket } from "@/hooks/usePlatformWebSocket";
import { swrDefaults } from "@/lib/api/swr";
import { WS_URL } from "@/lib/config";
import { HEARTBEAT_MS } from "@/lib/polling";
import { useAuthStore } from "@/store/authStore";
import { FakeSocket } from "../fakes/FakeSocket";
import { makeUser } from "../helpers";

const { replace, router, toast, apiGet } = vi.hoisted(() => {
  const replaceSpy = vi.fn();
  // Next's router object is stable between renders, so the mock must be too.
  return { replace: replaceSpy, router: { replace: replaceSpy }, toast: vi.fn(), apiGet: vi.fn() };
});

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("react-hot-toast", () => ({ default: toast }));
vi.mock("@/lib/api/client", () => ({ default: { get: apiGet } }));

const latest = FakeSocket.latest;

beforeEach(() => {
  vi.useFakeTimers();
  FakeSocket.instances = [];
  vi.stubGlobal("WebSocket", FakeSocket);
  apiGet.mockResolvedValue({});
  useAuthStore.getState().logout();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  replace.mockClear();
  toast.mockClear();
  apiGet.mockReset();
});

// A fresh cache per test, and no request merging, so each test counts its own calls.
function withSwr({ children }: { children: React.ReactNode }): React.ReactElement {
  return <SWRConfig value={{ ...swrDefaults, provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>;
}

function connectedHook() {
  useAuthStore.getState().login("jwt-1", makeUser());
  const hook = renderHook(() => usePlatformWebSocket(), { wrapper: withSwr });
  act(() => latest().open());
  return hook;
}

/** What the server pushes when an announcement or a personal notification is created. */
function pushed(id: string, overrides: Record<string, unknown> = {}) {
  return { event: "NOTIFICATION_RECEIVED", data: { id, kind: "announcement", title: "Notice", message: "", type: "info", ...overrides } };
}

describe("connecting", () => {
  it("does nothing while signed out", () => {
    renderHook(() => usePlatformWebSocket());
    expect(FakeSocket.instances).toHaveLength(0);
  });

  it("opens one socket and proves who the user is with the token", () => {
    connectedHook();

    expect(FakeSocket.instances).toHaveLength(1);
    expect(latest().url).toBe(WS_URL);
    expect(JSON.parse(latest().sent[0])).toEqual({ type: "auth", token: "jwt-1" });
  });

  it("closes the socket when the page goes away", () => {
    const { unmount } = connectedHook();
    const socket = latest();

    unmount();

    expect(socket.closedWith).toEqual({ code: 1000, reason: "component_unmount" });
  });

  it("keeps one socket when the page re-renders", () => {
    const { rerender } = connectedHook();

    rerender();
    rerender();

    expect(FakeSocket.instances).toHaveLength(1);
  });

  it("does not reconnect after the page closed it itself, when the browser reports the close", () => {
    const { unmount } = connectedHook();
    const socket = latest();

    unmount();
    act(() => socket.drop(1000, "component_unmount")); // a real socket reports its own close afterwards
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(FakeSocket.instances).toHaveLength(1);
  });

  it("does not let a socket that was replaced bring one back", () => {
    connectedHook();
    const first = latest();

    act(() => first.drop());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(FakeSocket.instances).toHaveLength(2);

    act(() => first.drop()); // a late close from the first socket
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(FakeSocket.instances).toHaveLength(2);
  });
});

describe("messages from the server", () => {
  it("moves the user to the suspended page when the institution is suspended", () => {
    connectedHook();

    act(() => latest().receive({ type: "tenant_suspended", message: "Licence expired" }));

    expect(useAuthStore.getState()).toMatchObject({ isSuspended: true, suspensionReason: "Licence expired" });
    expect(replace).toHaveBeenCalledWith("/suspended");
    expect(latest().closedWith?.reason).toBe("tenant_suspended");
  });

  it("signs the user out when the server forces a logout", () => {
    connectedHook();

    act(() => latest().receive({ type: "force_logout" }));

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("shows a new notification as a toast and tells the rest of the page", () => {
    connectedHook();
    const heard = vi.fn();
    window.addEventListener("app:notification_received", heard);

    act(() => latest().receive(pushed("n-toast-1", { title: "Holiday", message: "Closed on Friday" })));

    expect(toast).toHaveBeenCalledWith("Holiday: Closed on Friday", { duration: 6000 });
    expect(heard).toHaveBeenCalledOnce();
    window.removeEventListener("app:notification_received", heard);
  });

  it("announces the same notification once, however many times it arrives", () => {
    connectedHook();

    act(() => {
      latest().receive(pushed("n-twice-1"));
      latest().receive(pushed("n-twice-1"));
    });

    expect(toast).toHaveBeenCalledOnce();
  });

  it("does not toast the person who sent the announcement, but still tells the page", () => {
    connectedHook();
    const heard = vi.fn();
    window.addEventListener("app:notification_received", heard);

    act(() => latest().receive(pushed("n-own-1", { sender_id: useAuthStore.getState().user?.id })));

    expect(toast).not.toHaveBeenCalled();
    expect(heard).toHaveBeenCalledOnce();
    window.removeEventListener("app:notification_received", heard);
  });

  it("ignores a push that has no id, and the old message shapes", () => {
    connectedHook();

    act(() => {
      latest().receive({ event: "NOTIFICATION_RECEIVED", data: { title: "No id" } });
      latest().receive({ type: "notification", title: "Old shape", message: "x" });
    });

    expect(toast).not.toHaveBeenCalled();
  });

  it("ignores messages that are not JSON", () => {
    connectedHook();

    act(() => latest().receive("not json"));

    expect(toast).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("losing the connection", () => {
  it("sends a suspended institution to the suspended page and does not retry", () => {
    connectedHook();

    act(() => latest().drop(4403, "Tenant suspended"));
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(useAuthStore.getState().isSuspended).toBe(true);
    expect(replace).toHaveBeenCalledWith("/suspended");
    expect(FakeSocket.instances).toHaveLength(1);
  });

  it("reconnects after 5 seconds", () => {
    connectedHook();

    act(() => latest().drop());
    expect(FakeSocket.instances).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(FakeSocket.instances).toHaveLength(2);
  });

  it("gives up after 5 failed attempts", () => {
    connectedHook();

    for (let attempt = 0; attempt < 8; attempt += 1) {
      act(() => latest().drop());
      act(() => {
        vi.advanceTimersByTime(5000);
      });
    }

    expect(FakeSocket.instances).toHaveLength(6);
  });
});

async function elapse(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function showTab(state: "visible" | "hidden"): void {
  vi.spyOn(document, "visibilityState", "get").mockReturnValue(state);
}

describe("checking the institution is still active", () => {
  it("checks once on arrival, then every two minutes while the tab is visible", async () => {
    connectedHook();
    await elapse(0);
    expect(apiGet).toHaveBeenCalledTimes(1);

    await elapse(HEARTBEAT_MS * 2);

    expect(apiGet).toHaveBeenCalledTimes(3);
    expect(apiGet).toHaveBeenCalledWith("/auth/me", { params: undefined });
  });

  it("does not poll at all while the tab is hidden", async () => {
    connectedHook();
    await elapse(0);
    showTab("hidden");

    await elapse(HEARTBEAT_MS * 5);

    expect(apiGet).toHaveBeenCalledTimes(1);
  });

  it("checks again when the user comes back to the tab, but not more than once every 30 seconds", async () => {
    connectedHook();
    await elapse(0);
    await elapse(31_000);

    act(() => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("focus"));
    });
    await elapse(0);

    expect(apiGet).toHaveBeenCalledTimes(2);
  });

  it("stops asking once the user is signed out", async () => {
    const { unmount } = connectedHook();
    await elapse(0);
    unmount();

    await elapse(HEARTBEAT_MS * 3);

    expect(apiGet).toHaveBeenCalledTimes(1);
  });
});
