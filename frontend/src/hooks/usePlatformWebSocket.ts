"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import useSWR from "swr";
import { useAuthStore } from "@/store/authStore";
import { WS_URL } from "@/lib/config";
import { isFirstSighting, liveNotification, toastText } from "@/lib/notifications/live";
import { HEARTBEAT_MS } from "@/lib/polling";

type WsMessage = {
  type?: string;
  event?: string;
  message?: string;
  data?: Record<string, unknown>;
};

const RECONNECT_DELAY_MS = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * The live link to the server, one WebSocket for as long as the person is signed in:
 * 1. Push: a suspension or sign-out at once, and each new notification or announcement as it is created.
 * 2. Focus and visibility sync: re-verifies the institution when the user returns to the tab.
 * 3. A slow pulse while the tab is visible, as a fallback for a push that was missed.
 */
export function usePlatformWebSocket(): void {
  const { token, isAuthenticated, user, setSuspended, logout } = useAuthStore();
  const router = useRouter();

  // The socket's handlers outlive a render, so they read what they need from here rather than from stale closures.
  const latest = useRef({ router, setSuspended, logout, userId: user?.id });
  useEffect(() => {
    latest.current = { router, setSuspended, logout, userId: user?.id };
  });

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    let stopped = false;

    const handle = (raw: string, current: WebSocket): void => {
      let message: WsMessage;
      try {
        message = JSON.parse(raw) as WsMessage;
      } catch {
        return;
      }
      const { router: nav, setSuspended: suspend, logout: signOut, userId } = latest.current;

      if (message.type === "tenant_suspended") {
        suspend(true, message.message || "Your institution account has been temporarily suspended.");
        stopped = true;
        current.close(1000, "tenant_suspended");
        nav.replace("/suspended");
        return;
      }
      if (message.type === "force_logout") {
        signOut();
        nav.replace("/login");
        return;
      }

      const notification = liveNotification(message);
      if (!notification) return;
      if (isFirstSighting(notification.id) && notification.sender_id !== userId) {
        toast(toastText(notification), { duration: 6000 });
      }
      window.dispatchEvent(new CustomEvent("app:notification_received", { detail: notification }));
    };

    const open = (): void => {
      const ws = new WebSocket(WS_URL);
      socket = ws;
      ws.onopen = () => {
        attempts = 0;
        ws.send(JSON.stringify({ type: "auth", token }));
      };
      ws.onmessage = (event: MessageEvent) => handle(event.data as string, ws);
      ws.onclose = (event: CloseEvent) => {
        if (stopped || socket !== ws) return; // closed on purpose, or already replaced
        if (event.code === 4403) {
          latest.current.setSuspended(true, event.reason || "Your institution account has been temporarily suspended.");
          latest.current.router.replace("/suspended");
          return;
        }
        if (attempts < MAX_RECONNECT_ATTEMPTS) {
          attempts += 1;
          retry = setTimeout(open, RECONNECT_DELAY_MS);
        }
      };
      ws.onerror = () => ws.close();
    };

    open();

    return () => {
      stopped = true;
      clearTimeout(retry);
      socket?.close(1000, "component_unmount");
    };
  }, [isAuthenticated, token]);

  // Fallback check for a suspension or sign-out the WebSocket did not deliver. SWR runs it on return to the tab
  // and every couple of minutes, and not at all while the tab is hidden. A 403 or 401 is handled by the API client.
  useSWR(isAuthenticated && token ? "/auth/me" : null, { refreshInterval: HEARTBEAT_MS });
}
