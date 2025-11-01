import type {
  AppNotification,
  CreateNotificationPayload,
  UpdateNotificationPayload,
} from "../types/Notification";
import apiFetch from "./api";
import { fetchWithCache, invalidateCache } from "./requestCache";

type RawNotification = {
  id: number;
  title: string;
  message: string;
  priority: "low" | "normal" | "high";
  createdAt: string;
  scheduledAt?: string | null;
  pinned: boolean;
  areas: string[];
  roles: string[];
  createdBy?: { username: string } | null;
  readBy?: { userId: number; notificationId: number; read: boolean }[] | null;
  type?: string | null;
};

type NotificationsApiResponse =
  | RawNotification[]
  | {
      items?: RawNotification[] | null;
      data?: RawNotification[] | null;
      results?: RawNotification[] | null;
    };

const extractNotifications = (
  response: NotificationsApiResponse | null | undefined
): RawNotification[] => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  const candidates = [response.items, response.data, response.results];
  const firstArray = candidates.find(Array.isArray);
  return firstArray ? (firstArray as RawNotification[]) : [];
};

const toAppNotification = (raw: RawNotification): AppNotification => {
  let target: AppNotification["target"];
  if (Array.isArray(raw.areas) && raw.areas.length > 0) {
    target = { scope: "areas", areas: raw.areas };
  } else if (Array.isArray(raw.roles) && raw.roles.length > 0) {
    target = { scope: "roles", roles: raw.roles };
  } else {
    target = { scope: "global" };
  }

  const isScheduled = !!(
    raw.scheduledAt && new Date(raw.scheduledAt) > new Date()
  );
  const hasReadEntry = Array.isArray(raw.readBy)
    ? raw.readBy.some((entry) => entry.read)
    : false;

  return {
    id: raw.id.toString(),
    title: raw.title,
    message: raw.message,
    priority: raw.priority,
    status: isScheduled ? "scheduled" : "sent",
    target,
    createdBy: raw.createdBy?.username || "Sistema",
    createdAt: raw.createdAt,
    scheduledAt: raw.scheduledAt ?? undefined,
    pinned: raw.pinned,
    type: raw.type ?? undefined,
    read: hasReadEntry,
  };
};

const getNotificationCacheKey = () => {
  const rawUser = globalThis.localStorage?.getItem("userData");
  if (!rawUser) return "notifications:list:anon";
  try {
    const parsed = JSON.parse(rawUser) as Record<string, unknown> | null;
    if (!parsed) return "notifications:list:anon";
    const idCandidate = (parsed.id ?? parsed.userId) as
      | string
      | number
      | undefined;
    if (idCandidate === undefined) {
      return "notifications:list:anon";
    }
    return `notifications:list:${String(idCandidate)}`;
  } catch {
    return "notifications:list:anon";
  }
};

export async function listNotifications(
  forceRefresh = false
): Promise<AppNotification[]> {
  const cacheKey = getNotificationCacheKey();
  return fetchWithCache(
    cacheKey,
    async () => {
      const response = (await apiFetch(
        "/notification"
      )) as NotificationsApiResponse;
      const rawNotifications = extractNotifications(response);
      return rawNotifications.map(toAppNotification);
    },
    { force: forceRefresh }
  );
}

export async function createNotification(
  payload: CreateNotificationPayload
): Promise<AppNotification> {
  const created = (await apiFetch("/notification", {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      message: payload.message,
      priority: payload.priority,
      scheduledAt: payload.scheduledAt,
      target: payload.target,
    }),
  })) as RawNotification;
  invalidateCache(getNotificationCacheKey());
  return toAppNotification(created);
}

export async function updateNotification(
  id: string,
  payload: UpdateNotificationPayload
): Promise<AppNotification | null> {
  const updated = (await apiFetch(`/notification/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })) as RawNotification | null;
  invalidateCache(getNotificationCacheKey());
  return updated ? toAppNotification(updated) : null;
}

export async function deleteNotification(id: string): Promise<void> {
  await apiFetch(`/notification/${id}`, { method: "DELETE" });
  invalidateCache(getNotificationCacheKey());
}

export async function markNotificationAsRead(
  id: string
): Promise<AppNotification | null> {
  return updateNotification(id, { read: true });
}
