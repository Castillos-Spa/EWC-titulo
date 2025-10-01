import type {
  AppNotification,
  CreateNotificationPayload,
  UpdateNotificationPayload,
} from "../types/Notification";
import apiFetch from "./api";

// Este tipo representa la data cruda que viene del backend
type RawNotification = {
  id: number;
  title: string;
  message: string;
  priority: "low" | "normal" | "high";
  createdAt: string;
  scheduledAt?: string;
  pinned: boolean;
  areas: string[];
  roles: string[];
  createdBy?: { username: string };
  readBy: { userId: number; notificationId: number; read: boolean }[];
};

function toAppNotification(n: RawNotification): AppNotification {
  let target: AppNotification["target"];
  if (n.areas && n.areas.length > 0) {
    target = { scope: "areas", areas: n.areas };
  } else if (n.roles && n.roles.length > 0) {
    target = { scope: "roles", roles: n.roles };
  } else {
    target = { scope: "global" };
  }

  return {
    id: n.id.toString(),
    title: n.title,
    message: n.message,
    priority: n.priority,
    status:
      n.scheduledAt && new Date(n.scheduledAt) > new Date()
        ? "scheduled"
        : "sent",
    target,
    createdBy: n.createdBy?.username || "Sistema",
    createdAt: n.createdAt,
    scheduledAt: n.scheduledAt,
    pinned: n.pinned,
  };
}

export async function listNotifications(): Promise<AppNotification[]> {
  const notifications: RawNotification[] = await apiFetch("/notificacion");
  return notifications.map(toAppNotification);
}

export async function createNotification(
  payload: CreateNotificationPayload
): Promise<AppNotification> {
  const newNotification: RawNotification = await apiFetch("/notificacion", {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      message: payload.message,
      priority: payload.priority,
      scheduledAt: payload.scheduledAt,
      target: payload.target,
    }),
  });
  return toAppNotification(newNotification);
}

export async function updateNotification(
  id: string,
  payload: UpdateNotificationPayload
): Promise<AppNotification | null> {
  const updated: RawNotification | null = await apiFetch(
    `/notificacion/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
  return updated ? toAppNotification(updated) : null;
}

export async function deleteNotification(id: string): Promise<void> {
  await apiFetch(`/notificacion/${id}`, { method: "DELETE" });
}

/**
 * Marca una notificación como leída para el usuario actual.
 * @param id - El ID de la notificación a marcar como leída.
 */
export async function markNotificationAsRead(
  id: string
): Promise<AppNotification | null> {
  // El backend sabe qué usuario está haciendo la petición por el token JWT
  return updateNotification(id, { read: true });
}
