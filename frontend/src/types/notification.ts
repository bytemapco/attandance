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
  user_id?: string | null;
  role?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total_count: number;
  unread_count: number;
}

export interface NotificationBroadcastCreate {
  title: string;
  message: string;
  target_role?: "ALL" | "TEACHER" | "STUDENT" | "ADMIN";
  type?: NotificationType;
  category?: NotificationCategory;
  link?: string | null;
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

