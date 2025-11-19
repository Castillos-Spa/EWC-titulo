import { create } from 'zustand';
import { SocketService, NotificationWire } from '../services/SocketService';
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

const mapWireToApp = (n: NotificationWire): AppNotification => ({
  id: String((n as any).id ?? (n as any)._id ?? newId()),
  type: n.type ?? 'info',
  title: (n as any).title ?? undefined,
  message: n.message ?? '',
  timestamp: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
  read: Boolean(n.read),
  priority: (n as any).priority ?? undefined,
  targetScope: (n as any).target?.scope ?? undefined,
  targetAreas: (n as any).target?.areas ?? (n as any).areas ?? undefined,
  pinned: (n as any).pinned ?? undefined,
  scheduledAt: (n as any).scheduledAt ? new Date((n as any).scheduledAt).toISOString() : undefined,
});

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  connected: false,
  error: null,
  page: 0,
  totalPages: 0,
  hasMore: false,

  connect: () => {
    try {
      const user = useAuthStore.getState().user;
      const socket = SocketService.connect(user ?? undefined);

      socket.on('connect', () => set({ connected: true, error: null }));
      socket.on('connect_error', (err: any) => set({ error: err?.message ?? 'Error de conexión' }));
      socket.on('disconnect', () => set({ connected: false }));

      socket.on('notifications:init', (list) => {
        const arr: unknown = list;
        let normalized: any[] = [];
        if (Array.isArray(arr)) {
          normalized = arr;
        } else if (arr && typeof arr === 'object') {
          normalized = Object.values(arr as Record<string, unknown>);
        } else if (arr != null) {
          normalized = [arr];
        }
        const mapped = normalized.map(mapWireToApp);
        set({ items: mapped });
      });

      socket.on('notification', async (data) => {
        const payload: unknown = data;
        const items = Array.isArray(payload) ? payload.map(mapWireToApp) : [mapWireToApp(payload as any)];
        set((state) => ({ items: [...items, ...state.items].slice(0, 10) }));
        // Notificar sólo el primero para evitar spam si llegara un lote
        const first = items[0];
        await NotificationService.scheduleNotification('Nueva notificación', first.message, { id: first.id });
      });

      socket.on('notifications:error', (e) => set({ error: e?.message ?? 'Error' }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo conectar';
      set({ error: msg });
    }
  },

  disconnect: () => {
    SocketService.disconnect();
    set({ connected: false });
  },

  clear: () => set({ items: [] }),
  clearError: () => set({ error: null }),

  hydrateFromApi: async (page: number = 1) => {
    const res = await NotificationApi.list(page, 20);
    const mapped = (res.items ?? []).map((it: any) => ({
      id: String(it.id ?? it._id ?? newId()),
      type: it.type ?? 'info',
      title: it.title ?? undefined,
      message: it.message ?? '',
      timestamp: it.createdAt ? new Date(it.createdAt).toISOString() : new Date().toISOString(),
      read: Array.isArray(it.readBy) ? it.readBy.some((rb: any) => rb?.read) : false,
      priority: it.priority ?? undefined,
      targetScope: it.target?.scope ?? undefined,
      targetAreas: it.target?.areas ?? it.areas ?? undefined,
      pinned: it.pinned ?? undefined,
      scheduledAt: it.scheduledAt ? new Date(it.scheduledAt).toISOString() : undefined,
    }) as AppNotification);
    set({ items: mapped, page: res.page ?? 1, totalPages: res.totalPages ?? 1, hasMore: (res.page ?? 1) < (res.totalPages ?? 1) });
  },

  loadMore: async () => {
    const { page, totalPages, items } = get();
    if (page >= totalPages) {
      set({ hasMore: false });
      return;
    }
    const nextPage = page + 1;
    const res = await NotificationApi.list(nextPage, 20);
    const mapped = (res.items ?? []).map((it: any) => ({
      id: String(it.id ?? it._id ?? newId()),
      type: it.type ?? 'info',
      title: it.title ?? undefined,
      message: it.message ?? '',
      timestamp: it.createdAt ? new Date(it.createdAt).toISOString() : new Date().toISOString(),
      read: Array.isArray(it.readBy) ? it.readBy.some((rb: any) => rb?.read) : false,
      priority: it.priority ?? undefined,
      targetScope: it.target?.scope ?? undefined,
      targetAreas: it.target?.areas ?? it.areas ?? undefined,
      pinned: it.pinned ?? undefined,
      scheduledAt: it.scheduledAt ? new Date(it.scheduledAt).toISOString() : undefined,
    }) as AppNotification);
    // Evitar duplicados por id
    const existing = new Set(items.map(n => n.id));
    const merged = [...items, ...mapped.filter(n => !existing.has(n.id))];
    set({ items: merged, page: res.page ?? nextPage, totalPages: res.totalPages ?? totalPages, hasMore: (res.page ?? nextPage) < (res.totalPages ?? totalPages) });
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
