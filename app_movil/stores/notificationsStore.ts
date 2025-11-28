import { create } from 'zustand';
import { SocketService } from '../services/SocketService';
import { NotificationService } from '../services/NotificationService';
import { NotificationApi } from '../services/NotificationApi';
import { useAuthStore } from './authStore';

export type AppNotification = {
  id: string;
  type: string;
  title?: string;
  message: string;
  timestamp: string;
  read?: boolean;
  priority?: 'low' | 'normal' | 'high';
  targetScope?: 'global' | 'areas' | 'roles';
  targetAreas?: string[];
  pinned?: boolean;
  scheduledAt?: string | null;
};

interface NotificationsState {
  items: AppNotification[];
  connected: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  hasMore: boolean;
  loading: boolean;
  lastUpdated?: number;
  connect: () => void;
  disconnect: () => void;
  clear: () => void;
  hydrateFromApi: (page?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  clearError: () => void;
}

const newId = (() => {
  let seq = 0;
  return () => `${Date.now().toString(36)}-${(seq++).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
})();

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => typeof value === 'object' && value !== null;

const toTrimmedString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const toOptionalTrimmedString = (value: unknown): string | undefined => {
  const trimmed = toTrimmedString(value);
  return trimmed.length > 0 ? trimmed : undefined;
};

const toStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const sanitized = value.filter((entry): entry is string => typeof entry === 'string');
  return sanitized.length > 0 ? sanitized : undefined;
};

const toIsoString = (value: unknown): string => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value.length > 0) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return new Date().toISOString();
};

const toOptionalIsoString = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  return toIsoString(value);
};

const resolveMessage = (input: unknown): string => {
  if (!isRecord(input)) return 'Notificación';
  const rawMessage = toTrimmedString(input.message);
  if (rawMessage.length > 0) return rawMessage;
  const rawTitle = toTrimmedString(input.title);
  if (rawTitle.length > 0) return rawTitle;
  const rawType = toTrimmedString(input.type);
  return rawType.length > 0 ? rawType : 'Notificación';
};

const resolveRead = (record: UnknownRecord): boolean => {
  if (typeof record.read === 'boolean') return record.read;
  if (Array.isArray(record.readBy)) {
    return record.readBy.some((entry) => isRecord(entry) && Boolean(entry.read));
  }
  return false;
};

const toPriority = (value: unknown): AppNotification['priority'] | undefined => {
  const normalized = toTrimmedString(value);
  return normalized === 'low' || normalized === 'normal' || normalized === 'high' ? normalized : undefined;
};

const toScope = (value: unknown): AppNotification['targetScope'] | undefined => {
  const normalized = toTrimmedString(value);
  return normalized === 'global' || normalized === 'areas' || normalized === 'roles' ? normalized : undefined;
};

const toAppNotification = (input: unknown): AppNotification | null => {
  if (!isRecord(input)) return null;

  const idSource = input.id ?? input._id;
  const id = typeof idSource === 'string' || typeof idSource === 'number' ? String(idSource) : newId();
  const targetRecord = isRecord(input.target) ? input.target : undefined;

  return {
    id,
    type: toTrimmedString(input.type) || 'info',
    title: toOptionalTrimmedString(input.title),
    message: resolveMessage(input),
    timestamp: toIsoString(input.createdAt ?? input.timestamp),
    read: resolveRead(input),
    priority: toPriority(input.priority),
    targetScope: toScope(targetRecord?.scope),
    targetAreas: toStringArray(targetRecord?.areas) ?? toStringArray(input.areas),
    pinned: typeof input.pinned === 'boolean' ? input.pinned : undefined,
    scheduledAt: toOptionalIsoString(input.scheduledAt) ?? undefined,
  };
};

type ErrorInfo = {
  status?: number;
  code?: string;
  message?: string;
};

const getErrorInfo = (error: unknown): ErrorInfo => {
  if (!isRecord(error)) return {};
  const status = typeof error.status === 'number' ? error.status : undefined;
  const code = typeof error.code === 'string' ? error.code : undefined;
  const message = typeof error.message === 'string' ? error.message : undefined;
  return { status, code, message };
};

const mergeNotifications = (
  current: AppNotification[],
  incoming: AppNotification[],
  options?: { limit?: number; pruneEmpty?: boolean },
): AppNotification[] => {
  if (incoming.length === 0) {
    const baseline = options?.pruneEmpty ? current.filter((item) => Boolean(item.id) && Boolean(item.message)) : current;
    const sorted = [...baseline].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return typeof options?.limit === 'number' ? sorted.slice(0, options.limit) : sorted;
  }

  const map = new Map<string, AppNotification>();
  for (const item of current) {
    map.set(item.id, item);
  }
  for (const item of incoming) {
    map.set(item.id, item);
  }

  let merged = Array.from(map.values());
  if (options?.pruneEmpty) {
    merged = merged.filter((item) => Boolean(item.id) && Boolean(item.message));
  }
  merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return typeof options?.limit === 'number' ? merged.slice(0, options.limit) : merged;
};

const valueToArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  return value !== null && value !== undefined ? [value] : [];
};

const extractInitPayload = (payload: unknown): { items: AppNotification[]; page: number; totalPages: number } => {
  const asRecord = isRecord(payload) ? payload : undefined;
  const page = typeof asRecord?.page === 'number' ? asRecord.page : 1;
  const totalPages = typeof asRecord?.totalPages === 'number' ? asRecord.totalPages : 1;

  let candidates: unknown[] = [];
  if (Array.isArray(payload)) {
    candidates = payload;
  } else if (asRecord) {
    if (Array.isArray(asRecord.items)) {
      candidates = asRecord.items;
    } else if (Array.isArray(asRecord.data)) {
      candidates = asRecord.data;
    } else if (Array.isArray(asRecord.results)) {
      candidates = asRecord.results;
    } else {
      candidates = [asRecord];
    }
  }

  const items = candidates
    .map(toAppNotification)
    .filter((notification): notification is AppNotification => notification !== null);

  return { items, page, totalPages };
};

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  connected: false,
  error: null,
  page: 0,
  totalPages: 0,
  hasMore: false,
  loading: false,
  lastUpdated: undefined,

  connect: () => {
    try {
      const user = useAuthStore.getState().user;
      const socket = SocketService.connect(user ?? undefined);

      // Ensure we have a fresh snapshot from REST even if the socket takes time to initialise.
      void get().hydrateFromApi(1).catch((error) => {
        console.warn('notifications hydrate failed', error);
      });

      socket.on('connect', () => set({ connected: true, error: null }));
      socket.on('connect_error', (err) => {
        const { message } = getErrorInfo(err);
        set({ error: message ?? 'Error de conexión', loading: false });
      });
      socket.on('disconnect', () => set({ connected: false }));

      socket.on('notifications:init', (payload) => {
        const { items: mapped, page, totalPages } = extractInitPayload(payload);

        if (mapped.length === 0) {
          return set({
            items: [],
            page,
            totalPages,
            hasMore: page < totalPages,
            loading: false,
            error: null,
            lastUpdated: Date.now(),
          });
        }

        set((state) => ({
          items: mergeNotifications(state.items, mapped, { limit: 20 }),
          page,
          totalPages,
          hasMore: page < totalPages,
          loading: false,
          error: null,
          lastUpdated: Date.now(),
        }));
      });

      socket.on('notification', async (data) => {
        const items = valueToArray(data)
          .map(toAppNotification)
          .filter((notification): notification is AppNotification => notification !== null);
        if (items.length === 0) return;

        set((state) => ({
          items: mergeNotifications(state.items, items, { limit: 20 }),
          lastUpdated: Date.now(),
        }));

        const first = items[0];
        await NotificationService.scheduleNotification('Nueva notificación', first.message, { id: first.id });
      });

      socket.on('notifications:error', (e) => {
        const { message } = getErrorInfo(e);
        set({ error: message ?? 'Error', loading: false });
      });
    } catch (error) {
      const { message } = getErrorInfo(error);
      set({ error: message ?? 'No se pudo conectar', loading: false });
    }
  },

  disconnect: () => {
    SocketService.disconnect();
    set({ connected: false });
  },

  clear: () => set({ items: [] }),
  clearError: () => set({ error: null }),

  hydrateFromApi: async (page: number = 1) => {
    set({ loading: true, error: null });
    try {
      const res = await NotificationApi.list(page, 20);
      const itemsFromApi = Array.isArray(res.items) ? res.items : [];

      if (itemsFromApi.length === 0) {
        set({
          items: [],
          page: res.page ?? 1,
          totalPages: res.totalPages ?? 1,
          hasMore: false,
          loading: false,
          lastUpdated: Date.now(),
        });
        return;
      }

      const mapped = itemsFromApi
        .map(toAppNotification)
        .filter((item): item is AppNotification => item !== null);

      set((state) => ({
        items: mergeNotifications(state.items, mapped, { pruneEmpty: true }),
        page: res.page ?? 1,
        totalPages: res.totalPages ?? 1,
        hasMore: (res.page ?? 1) < (res.totalPages ?? 1),
        loading: false,
        lastUpdated: Date.now(),
      }));
    } catch (error) {
      const { message } = getErrorInfo(error);
      set({ error: message ?? 'No se pudieron cargar las notificaciones', loading: false });
      throw error;
    }
  },

  loadMore: async () => {
    const { page, totalPages, items } = get();
    if (page >= totalPages) {
      set({ hasMore: false });
      return;
    }
    const nextPage = page + 1;
    set({ loading: true });
    try {
      const res = await NotificationApi.list(nextPage, 20);
      const mapped = (res.items ?? [])
        .map(toAppNotification)
        .filter((item): item is AppNotification => item !== null);
      const merged = mergeNotifications(items, mapped, { pruneEmpty: true });
      set({
        items: merged,
        page: res.page ?? nextPage,
        totalPages: res.totalPages ?? totalPages,
        hasMore: (res.page ?? nextPage) < (res.totalPages ?? totalPages),
        loading: false,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      const { message } = getErrorInfo(error);
      set({ error: message ?? 'No se pudieron cargar las notificaciones', loading: false });
      throw error;
    }
  },

  markAsRead: async (id: string) => {
    // Optimista
    const prev = get().items;
    const next = prev.map(n => (n.id === id ? { ...n, read: true } : n));
    set({ items: next });
    try {
      // Solo intentar en backend si es numérico
      const n = Number.parseInt(String(id), 10);
      if (Number.isFinite(n)) {
        await NotificationApi.markAsRead(n);
      }
    } catch (error) {
      // revertir si falla
      set({ items: prev });
      const { status, code, message } = getErrorInfo(error);
      if (status === 403 || code === 'E_PERM') {
        set({ error: message ?? 'Permiso denegado.' });
        return;
      }
      set({ error: message ?? 'Error al marcar notificación.' });
    }
  },
}));
