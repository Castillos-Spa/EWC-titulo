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

const resolveMessage = (input: any): string => {
  const rawMessage = typeof input?.message === 'string' ? input.message.trim() : '';
  if (rawMessage.length > 0) return rawMessage;
  const rawTitle = typeof input?.title === 'string' ? input.title.trim() : '';
  if (rawTitle.length > 0) return rawTitle;
  const rawType = typeof input?.type === 'string' ? input.type.trim() : '';
  return rawType.length > 0 ? rawType : 'Notificación';
};

const toAppNotification = (input: any): AppNotification | null => {
  if (!input || typeof input !== 'object') return null;

  const idSource = (input as any).id ?? (input as any)._id;
  const id = idSource ? String(idSource) : newId();
  const typeRaw = typeof (input as any).type === 'string' ? (input as any).type.trim() : '';
  const titleRaw = typeof (input as any).title === 'string' ? (input as any).title.trim() : '';
  const timestampSource = (input as any).createdAt ?? (input as any).timestamp;
  const readField = (input as any).read;
  const readByField = (input as any).readBy;
  const priorityRaw = typeof (input as any).priority === 'string' ? (input as any).priority : undefined;
  const scopeRaw = (input as any).target?.scope;

  const validPriorities: AppNotification['priority'][] = ['low', 'normal', 'high'];
  const priority = priorityRaw && validPriorities.includes(priorityRaw as AppNotification['priority'])
    ? (priorityRaw as AppNotification['priority'])
    : undefined;

  const validScopes: AppNotification['targetScope'][] = ['global', 'areas', 'roles'];
  const targetScope = typeof scopeRaw === 'string' && validScopes.includes(scopeRaw as AppNotification['targetScope'])
    ? (scopeRaw as AppNotification['targetScope'])
    : undefined;

  const read = typeof readField === 'boolean'
    ? readField
    : Array.isArray(readByField)
      ? readByField.some((entry: any) => Boolean(entry?.read))
      : false;

  return {
    id,
    type: typeRaw.length > 0 ? typeRaw : 'info',
    title: titleRaw.length > 0 ? titleRaw : undefined,
    message: resolveMessage(input),
    timestamp: timestampSource ? new Date(timestampSource).toISOString() : new Date().toISOString(),
    read,
    priority,
    targetScope,
    targetAreas: Array.isArray((input as any).target?.areas)
      ? (input as any).target.areas
      : Array.isArray((input as any).areas)
        ? (input as any).areas
        : undefined,
    pinned: typeof (input as any).pinned === 'boolean' ? (input as any).pinned : undefined,
    scheduledAt: (input as any).scheduledAt ? new Date((input as any).scheduledAt).toISOString() : undefined,
  };
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
      socket.on('connect_error', (err: any) => set({ error: err?.message ?? 'Error de conexión', loading: false }));
      socket.on('disconnect', () => set({ connected: false }));

      socket.on('notifications:init', (payload) => {
        const rawItems: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray((payload as any)?.items)
            ? (payload as any).items
            : Array.isArray((payload as any)?.data)
              ? (payload as any).data
              : Array.isArray((payload as any)?.results)
                ? (payload as any).results
                : payload != null && !Array.isArray(payload)
                  ? [payload]
                  : [];

        const page = typeof (payload as any)?.page === 'number' ? (payload as any).page : 1;
        const totalPages = typeof (payload as any)?.totalPages === 'number' ? (payload as any).totalPages : 1;

        const mapped = rawItems
          .map(toAppNotification)
          .filter((n): n is AppNotification => n !== null);

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

        set((state) => {
          const mergedMap = new Map<string, AppNotification>();
          for (const existing of state.items) {
            mergedMap.set(existing.id, existing);
          }
          for (const notification of mapped) {
            mergedMap.set(notification.id, notification);
          }
          const merged = Array.from(mergedMap.values())
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 20);
          return {
            items: merged,
            page,
            totalPages,
            hasMore: page < totalPages,
            loading: false,
            error: null,
            lastUpdated: Date.now(),
          };
        });
      });

      socket.on('notification', async (data) => {
        const payloadArray = Array.isArray(data) ? data : [data];
        const items = payloadArray
          .map(toAppNotification)
          .filter((n): n is AppNotification => n !== null);
        if (items.length === 0) return;

        set((state) => {
          const mergedMap = new Map<string, AppNotification>();
          for (const item of items) {
            mergedMap.set(item.id, item);
          }
          for (const existing of state.items) {
            if (!mergedMap.has(existing.id)) {
              mergedMap.set(existing.id, existing);
            }
          }
          const merged = Array.from(mergedMap.values())
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 20);
          return { items: merged, lastUpdated: Date.now() };
        });

        const first = items[0];
        await NotificationService.scheduleNotification('Nueva notificación', first.message, { id: first.id });
      });

      socket.on('notifications:error', (e) => set({ error: e?.message ?? 'Error', loading: false }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo conectar';
      set({ error: msg, loading: false });
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

      set((state) => {
        const mergedMap = new Map<string, AppNotification>();
        for (const item of state.items) {
          mergedMap.set(item.id, item);
        }
        for (const item of mapped) {
          mergedMap.set(item.id, item);
        }
        const merged = Array.from(mergedMap.values())
          .filter((item) => Boolean(item.id) && Boolean(item.message))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return {
          items: merged,
          page: res.page ?? 1,
          totalPages: res.totalPages ?? 1,
          hasMore: (res.page ?? 1) < (res.totalPages ?? 1),
          loading: false,
          lastUpdated: Date.now(),
        };
      });
    } catch (error: any) {
      set({ error: error?.message || 'No se pudieron cargar las notificaciones', loading: false });
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
      // Evitar duplicados por id
      const existing = new Set(items.map(n => n.id));
      const merged = [...items, ...mapped.filter(n => !existing.has(n.id))]
        .filter((item) => Boolean(item.id) && Boolean(item.message));
      set({
        items: merged,
        page: res.page ?? nextPage,
        totalPages: res.totalPages ?? totalPages,
        hasMore: (res.page ?? nextPage) < (res.totalPages ?? totalPages),
        loading: false,
        lastUpdated: Date.now(),
      });
    } catch (error: any) {
      set({ error: error?.message || 'No se pudieron cargar las notificaciones', loading: false });
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
    } catch (e) {
      // revertir si falla
      set({ items: prev });
      if (e?.status === 403 || e?.code === 'E_PERM') {
        set({ error: e.message || 'Permiso denegado.' });
        return;
      }
      set({ error: e?.message || 'Error al marcar notificación.' });
    }
  },
}));
