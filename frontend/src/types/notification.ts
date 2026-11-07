export type NotificationType = "info" | "success" | "warning" | "danger" | "critical";

export type NotificationCategory =
  | "attendance"
  | "leave"
  | "device"
  | "security"
  | "system"
  | "maintenance"
  | "update";

export interface NotificationItem {
  id: string;
  /** Written for this person, or shared with a group (an announcement). */
  kind: "personal" | "announcement";
  user_id?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  /** The assistant and the daily briefing add categories of their own. */
  category: NotificationCategory | string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total_count: number;
  unread_count: number;
}

export type Audience = "ALL" | "TEACHER" | "STUDENT" | "ADMIN";

export interface NotificationBroadcastCreate {
  title: string;
  message: string;
  target_role: Audience;
  type?: NotificationType;
  category?: NotificationCategory;
  link?: string | null;
  /** Show it from this moment (ISO, UTC). Empty means now. */
  publish_at?: string;
}

/** What the server pushes the moment an announcement or a personal notification is created. */
export interface LiveNotification {
  id: string;
  kind: NotificationItem["kind"];
  sender_id?: string | null;
  title: string;
  message: string;
  type: NotificationType;
}

export type NotificationFilterTab =
  | "all"
  | "unread"
  | "attendance"
  | "leave"
  | "device"
  | "security"
  | "system"
  | "maintenance"
  | "update";

