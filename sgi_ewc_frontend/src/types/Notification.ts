export type NotificationPriority = 'low' | 'normal' | 'high';

export type NotificationTarget =
  | { scope: 'global' }
  | { scope: 'areas'; areas: string[] };

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  target: NotificationTarget;
  createdBy: string;
  createdAt: string; // ISO
  scheduledAt?: string; // ISO
  status: 'sent' | 'scheduled';
  pinned?: boolean;
  updatedAt?: string; // ISO
}

export const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: 'Baja',
  normal: 'Normal',
  high: 'Alta',
};
