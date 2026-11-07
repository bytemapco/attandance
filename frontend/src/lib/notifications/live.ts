import type { LiveNotification, NotificationItem } from "@/types/notification";

const REMEMBERED = 200;
const announced = new Set<string>();

/**
 * True the first time this tab hears of a notification. The same one can arrive twice (a reconnect, a second
 * connection), and a person should be told once.
 */
export function isFirstSighting(id: string): boolean {
  if (announced.has(id)) return false;
  announced.add(id);
  if (announced.size > REMEMBERED) announced.delete(announced.values().next().value as string);
  return true;
}

/** The notification inside a pushed message, or null when the message is about something else or has no id. */
export function liveNotification(message: { event?: string; data?: Record<string, unknown> }): LiveNotification | null {
  const data = message.event === "NOTIFICATION_RECEIVED" ? message.data : undefined;
  if (!data || typeof data.id !== "string" || typeof data.title !== "string") return null;
  return {
    id: data.id,
    kind: data.kind === "announcement" ? "announcement" : "personal",
    sender_id: typeof data.sender_id === "string" ? data.sender_id : null,
    title: data.title,
    message: typeof data.message === "string" ? data.message : "",
    type: (data.type as NotificationItem["type"]) ?? "info",
  };
}

export function toastText(notification: LiveNotification): string {
  return notification.message ? `${notification.title}: ${notification.message}` : notification.title;
}
