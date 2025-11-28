import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { AppNotification, CreateNotificationPayload, UpdateNotificationPayload } from '../../../types/Notification';
import { listNotifications, createNotification, updateNotification, deleteNotification } from '../../../utils/notificationApi';

type Ctx = {
  items: AppNotification[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (payload: CreateNotificationPayload) => Promise<AppNotification>;
  update: (id: string, payload: UpdateNotificationPayload) => Promise<AppNotification | null>;
  remove: (id: string) => Promise<void>;
};

const NotificationsContext = createContext<Ctx | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listNotifications();
      setItems(data);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (payload: CreateNotificationPayload) => {
    const created = await createNotification(payload);
    setItems(prev => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, payload: UpdateNotificationPayload) => {
    const updated = await updateNotification(id, payload);
    if (updated) setItems(prev => prev.map(n => n.id === id ? updated : n));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteNotification(id);
    setItems(prev => prev.filter(n => n.id !== id));
  }, []);

  const value = useMemo<Ctx>(() => ({ items, loading, error, refresh, create, update, remove }), [items, loading, error, refresh, create, update, remove]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export default NotificationsContext;