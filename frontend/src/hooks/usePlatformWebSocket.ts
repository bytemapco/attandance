"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

type WsMessage = {
  type?: string;
  event?: string;
  message?: string;
  title?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
};

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws/connect";
const RECONNECT_DELAY_MS = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Enterprise-grade real-time platform listener:
 * 1. WebSocket Push: Instant server-push on tenant suspension (4403) and broadcasts.
 * 2. Focus & Visibility Sync: Instantly re-verifies institutional status when user switches tabs.
 * 3. Periodic Pulse: 10s background check guaranteeing active eviction without user interaction.
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
          toast(message ? `${title}: ${message}` : title, {
            icon: "📢",
            duration: 6000,
          });
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

  // Tab switch & visibility change heartbeat verification
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const checkStatus = async (): Promise<void> => {
      try {
        await api.get("/auth/me");
      } catch {
        // api.ts interceptor automatically redirects to /suspended on 403
      }
    };

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        void checkStatus();
      }
    };

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const interval = setInterval(() => void checkStatus(), 10000);

    return (): void => {
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [isAuthenticated, token]);
}
