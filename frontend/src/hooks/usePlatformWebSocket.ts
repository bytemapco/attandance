"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import useSWR from "swr";
import { useAuthStore } from "@/store/authStore";
import { WS_URL } from "@/lib/config";
import { HEARTBEAT_MS } from "@/lib/polling";

type WsMessage = {
  type?: string;
  event?: string;
  message?: string;
  title?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
};

const RECONNECT_DELAY_MS = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Enterprise-grade real-time platform listener:
 * 1. WebSocket Push: Instant server-push on tenant suspension (4403) and broadcasts.
 * 2. Focus & Visibility Sync: re-verifies institutional status when the user returns to the tab.
 * 3. Periodic Pulse: a slow background check while the tab is visible, as a fallback for a missed push.
 */
export function usePlatformWebSocket(): void {
  const { token, isAuthenticated, setSuspended, logout } = useAuthStore();
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectRef = useRef<() => void>(() => {});

  const handleMessage = useCallback(
    (raw: string): void => {
      let msg: WsMessage;
      try {
        msg = JSON.parse(raw) as WsMessage;
      } catch {
        return;
      }

      if (msg.type === "tenant_suspended") {
        setSuspended(true, msg.message || "Your institution account has been temporarily suspended.");
        wsRef.current?.close(1000, "tenant_suspended");
        wsRef.current = null;
        router.replace("/suspended");
        return;
      }

      if (msg.type === "force_logout") {
        logout();
        router.replace("/login");
        return;
      }

      if (msg.event === "NOTIFICATION_RECEIVED" || msg.type === "notification" || msg.type === "broadcast") {
        const notifData = msg.data || msg;
        const title = (notifData.title as string) || "System Announcement";
        const message = (notifData.message as string) || "";
        if (title || message) {
          toast(message ? `${title}: ${message}` : title, { duration: 6000 });
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("app:notification_received", { detail: notifData })
          );
        }
      }
    },
    [setSuspended, logout, router]
  );

  const connect = useCallback((): void => {
    if (!token || !isAuthenticated) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = (): void => {
        reconnectCount.current = 0;
        ws.send(JSON.stringify({ type: "auth", token }));
      };

      ws.onmessage = (event: MessageEvent): void => {
        handleMessage(event.data as string);
      };

      ws.onclose = (event: CloseEvent): void => {
        if (event.code === 4403) {
          setSuspended(true, event.reason || "Your institution account has been temporarily suspended.");
          router.replace("/suspended");
          return;
        }
        if (reconnectCount.current < MAX_RECONNECT_ATTEMPTS && isAuthenticated) {
          reconnectCount.current += 1;
          reconnectTimer.current = setTimeout(() => {
            connectRef.current();
          }, RECONNECT_DELAY_MS);
        }
      };

      ws.onerror = (): void => {
        ws.close();
      };
    } catch {
      // Graceful fallback for offline dev environments
    }
  }, [token, isAuthenticated, handleMessage, setSuspended, router]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    connect();

    return (): void => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close(1000, "component_unmount");
      wsRef.current = null;
    };
  }, [isAuthenticated, token, connect]);

  // Fallback check for a suspension or sign-out the WebSocket did not deliver. SWR runs it on return to the tab
  // and every couple of minutes, and not at all while the tab is hidden. A 403 or 401 is handled by the API client.
  useSWR(isAuthenticated && token ? "/auth/me" : null, { refreshInterval: HEARTBEAT_MS });
}
