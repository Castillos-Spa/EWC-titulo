import React, { useMemo, useState } from 'react';
import { Bell, Plus } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import type { AppNotification, CreateNotificationPayload } from '../../../types/Notification';
import { NotificationsProvider } from '../context/NotificationsContext';
import { useNotifications } from '../hooks/useNotifications';
import NotificationStats from '../components/NotificationStats';
import NotificationFilters from '../components/NotificationFilters';
import NotificationBoard from '../components/NotificationBoard';
import NotificationEditorModal from '../components/NotificationEditorModal';

const DEFAULT_AREAS = ['IT', 'Transporte', 'Obras', 'Aseo', 'RRHH', 'Finanza', 'P_Riesgo'];

const NotificationsPageInner: React.FC = () => {
  const { user } = useAuth();
  const { items, loading, error, create, update, remove } = useNotifications();
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<'all' | 'global' | 'areas'>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<AppNotification | null>(null);

  const areasUniverse = useMemo(() => {
    const collected = items.flatMap(notification => {
      if (notification.target.scope === 'areas') return notification.target.areas;
      if (notification.target.scope === 'roles') return notification.target.roles;
      return [] as string[];
    });
    return Array.from(new Set([...DEFAULT_AREAS, ...collected]));
  }, [items]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter(notification => {
      const matchesText = query === '' || notification.title.toLowerCase().includes(query) || notification.message.toLowerCase().includes(query);
      const matchesScope = scope === 'all' || notification.target.scope === scope;
      const matchesArea = areaFilter === 'all' || (notification.target.scope === 'areas' && notification.target.areas.includes(areaFilter));
      return matchesText && matchesScope && matchesArea;
    });
  }, [items, search, scope, areaFilter]);

  const resetFilters = () => {
    setSearch('');
    setScope('all');
    setAreaFilter('all');
  };

  const handleCreate = async (payload: CreateNotificationPayload) => {
    await create(payload);
    setComposerOpen(false);
  };

  const handleEdit = async (payload: CreateNotificationPayload) => {
    if (!editing) return;
    await update(editing.id, { ...payload });
    setEditing(null);
  };

  const handleTogglePin = async (notification: AppNotification) => {
    await update(notification.id, { pinned: !notification.pinned });
  };

  const handleDelete = async (notification: AppNotification) => {
    if (!globalThis.confirm('¿Eliminar notificación?')) return;
    await remove(notification.id);
  };

  const heroButton = user?.isAdmin ? (
    <button
      type="button"
      onClick={() => setComposerOpen(true)}
      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
    >
      <Plus className="h-4 w-4" />
      Nueva notificación
    </button>
  ) : null;

  return (
    <div className="space-y-10 text-slate-800 dark:text-slate-100">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-sky-100 via-white to-indigo-100 px-8 py-6 shadow-xl shadow-slate-200/40 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="pointer-events-none absolute -left-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-sky-400/30 blur-3xl dark:bg-sky-500/20" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-indigo-300/40 blur-3xl dark:bg-indigo-500/20" />
        <div className="relative flex flex-wrap items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
              <Bell className="h-4 w-4" />
              <span>Notificaciones</span>
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Centro corporativo de avisos</h1>
            <p className="text-sm text-slate-600 dark:text-blue-100/80">
              Orquesta comunicaciones internas, segmenta por áreas críticas y alinea cada mensaje con la nueva estética del hub digital.
            </p>
          </div>
          {heroButton}
        </div>
      </section>

      <NotificationStats items={items} loading={loading} />

      <NotificationFilters
        search={search}
        scope={scope}
        area={areaFilter}
        areaOptions={areasUniverse}
        total={filtered.length}
        onSearch={setSearch}
        onScopeChange={setScope}
        onAreaChange={setAreaFilter}
        onReset={resetFilters}
      />

      <NotificationBoard
        items={filtered}
        loading={loading}
        error={error}
        isAdmin={Boolean(user?.isAdmin)}
        onEdit={setEditing}
        onDelete={handleDelete}
        onTogglePin={handleTogglePin}
      />

      <NotificationEditorModal
        open={composerOpen}
        mode="create"
        areas={areasUniverse}
        onClose={() => setComposerOpen(false)}
        onSubmit={handleCreate}
      />

      <NotificationEditorModal
        open={Boolean(editing)}
        mode="edit"
        areas={areasUniverse}
        initial={editing ?? undefined}
        onClose={() => setEditing(null)}
        onSubmit={handleEdit}
      />
    </div>
  );
};

const NotificationsPage: React.FC = () => (
  <NotificationsProvider>
    <NotificationsPageInner />
  </NotificationsProvider>
);

export default NotificationsPage;