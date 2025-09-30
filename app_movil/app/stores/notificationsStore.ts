import { create } from 'zustand';
import { SocketService, NotificationWire } from '../services/SocketService';
import { NotificationService } from '../services/NotificationService';
import { NotificationApi } from '../services/NotificationApi';
import { useAuthStore } from './authStore';

export type AppNotification = {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read?: boolean;
};

interface NotificationsState {
  items: AppNotification[];
  connected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  clear: () => void;
  markAsRead: (id: string) => Promise<void>;
}

const mapWireToApp = (n: NotificationWire): AppNotification => ({
  id: String(n.id ?? Date.now()),
  type: n.type ?? 'info',
  message: n.message ?? '',
  timestamp: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
  read: Boolean(n.read),
});

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  connected: false,
  error: null,

  connect: () => {
    try {
      const user = useAuthStore.getState().user;
      const socket = SocketService.connect(user ?? undefined);

      socket.on('connect', () => set({ connected: true, error: null }));
      socket.on('connect_error', (err: any) => set({ error: err?.message ?? 'Error de conexión' }));
      socket.on('disconnect', () => set({ connected: false }));

      socket.on('notifications:init', (list) => {
        const mapped = (list ?? []).map(mapWireToApp);
        set({ items: mapped });
      });

      socket.on('notification', async (data) => {
        const item = mapWireToApp(data);
        set((state) => ({ items: [item, ...state.items].slice(0, 10) }));
        await NotificationService.scheduleNotification('Nueva notificación', item.message, { id: item.id });
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

  markAsRead: async (id: string) => {
    // Optimista
    const prev = get().items;
    const next = prev.map(n => (n.id === id ? { ...n, read: true } : n));
    set({ items: next });
    try {
      await NotificationApi.markAsRead(id);
    } catch (e) {
      // revertir si falla
      set({ items: prev });
      throw e;
    }
  },
}));
