export type NotificationPriority = "low" | "normal" | "high";

export type NotificationTarget =
  | { scope: "global" }
  | { scope: "areas"; areas: string[] }
  | { scope: "roles"; roles: string[] };

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: "sent" | "scheduled";
  target: NotificationTarget;
  createdBy: string;
  createdAt: string;
  scheduledAt?: string;
  pinned: boolean;
  type?: string;
  read?: boolean;
};

export type RawNotification = {
  id: number;
  title: string;
  message: string;
  priority: NotificationPriority;
  createdAt: string;
  scheduledAt?: string | null;
  pinned: boolean;
  areas: string[];
  roles: string[];
  createdBy?: { username: string } | null;
  readBy?: { userId: number; notificationId: number; read: boolean }[] | null;
  type?: string | null;
};

export const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  high: "Alta",
  normal: "Normal",
  low: "Baja",
};

export type CreateNotificationPayload = {
  title: string;
  message: string;
  priority: NotificationPriority;
  target: NotificationTarget;
  scheduledAt?: string;
};

export type UpdateNotificationPayload = Partial<
  CreateNotificationPayload & { pinned: boolean; read: boolean }
>;
