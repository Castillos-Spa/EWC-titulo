import type { AppNotification, NotificationTarget, NotificationPriority } from '../types/Notification';

let notifications: AppNotification[] = [
  {
    id: 'n-1',
    title: 'Mantención programada',
    message: 'Habrá mantención del sistema el viernes a las 18:00.',
    priority: 'normal',
    target: { scope: 'global' },
    createdBy: 'admin',
    createdAt: new Date(Date.now() - 36e5).toISOString(),
    status: 'sent',
  },
  {
    id: 'n-2',
    title: 'Recordatorio Taller',
    message: 'Revisar stock de repuestos críticos hoy.',
    priority: 'high',
    target: { scope: 'areas', areas: ['Taller'] },
    createdBy: 'taller-supervisor',
    createdAt: new Date(Date.now() - 2 * 36e5).toISOString(),
    status: 'sent',
  },
];

export type CreateNotificationPayload = {
  title: string;
  message: string;
  priority: NotificationPriority;
  target: NotificationTarget;
  scheduledAt?: string;
  createdBy: string;
};

export async function listNotifications(): Promise<AppNotification[]> {
  return Promise.resolve([...notifications].sort((a, b) => {
    // Pinned first
    const ap = a.pinned ? 1 : 0; const bp = b.pinned ? 1 : 0;
    if (ap !== bp) return bp - ap;
    // Then by updatedAt or createdAt desc
    const ad = a.updatedAt ?? a.createdAt; const bd = b.updatedAt ?? b.createdAt;
    return bd.localeCompare(ad);
  }));
}

export async function createNotification(payload: CreateNotificationPayload): Promise<AppNotification> {
  const n: AppNotification = {
    id: `n-${Date.now()}`,
    title: payload.title,
    message: payload.message,
    priority: payload.priority,
    target: payload.target,
    createdBy: payload.createdBy,
    createdAt: new Date().toISOString(),
    scheduledAt: payload.scheduledAt,
    status: payload.scheduledAt ? 'scheduled' : 'sent',
  };
  notifications = [n, ...notifications];
  return Promise.resolve(n);
}

export type UpdateNotificationPayload = Partial<Pick<AppNotification, 'title'|'message'|'priority'|'target'|'scheduledAt'|'status'|'pinned'>>;

export async function updateNotification(id: string, patch: UpdateNotificationPayload): Promise<AppNotification | null> {
  const idx = notifications.findIndex(n => n.id === id);
  if (idx === -1) return Promise.resolve(null);
  const updated: AppNotification = { ...notifications[idx], ...patch, updatedAt: new Date().toISOString() };
  notifications[idx] = updated;
  return Promise.resolve(updated);
}

export async function deleteNotification(id: string): Promise<void> {
  notifications = notifications.filter(n => n.id !== id);
}
import apiFetch from "./api";

/**
 * Marca una notificación como leída en el backend.
 * Asumimos que tienes un endpoint como: PATCH /notifications/:id/read
 */
export async function markNotificationAsRead(
  notificationId: string | number
): Promise<void> {
  // No esperamos una respuesta, pero la API debería devolver un 200 OK.
  return apiFetch(`/notifications/${notificationId}/read`, { method: "PATCH" });
}
