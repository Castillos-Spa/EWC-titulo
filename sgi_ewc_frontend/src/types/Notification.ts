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
