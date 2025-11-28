import React from 'react';
import { useIntlFormat } from '../../../app/intl/format';
import {
  CalendarCheck2,
  Globe2,
  Users2,
  ShieldAlert,
  Pin,
  PinOff,
  Pencil,
} from 'lucide-react';
import type { AppNotification, NotificationPriority, NotificationTarget } from '../../../types/Notification';

interface NotificationBoardProps {
  items: AppNotification[];
  loading: boolean;
  error?: string | null;
  isAdmin: boolean;
  onEdit: (notification: AppNotification) => void;
  onTogglePin: (notification: AppNotification) => void;
}

type PriorityConfig = {
  badge: string;
  label: string;
};

const priorityStyles: Record<NotificationPriority, PriorityConfig> = {
  high: {
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200',
    label: 'Alta prioridad',
  },
  normal: {
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200',
    label: 'Prioridad normal',
  },
  low: {
    badge: 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-blue-100',
    label: 'Prioridad baja',
  },
};

const targetDescriptor = (target: NotificationTarget) => {
  if (target.scope === 'global') {
    return {
      icon: <Globe2 className="h-3.5 w-3.5" />,
      text: 'Global',
    };
  }
  if (target.scope === 'areas') {
    return {
      icon: <Users2 className="h-3.5 w-3.5" />,
      text: `Áreas: ${target.areas.join(', ')}`,
    };
  }
  return {
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
    text: `Roles: ${target.roles.join(', ')}`,
  };
};

const NotificationBoard: React.FC<NotificationBoardProps> = ({
  items,
  loading,
  error,
  isAdmin,
  onEdit,
  onTogglePin,
}) => {
  const { formatDateTime } = useIntlFormat();
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200/60 bg-white/70 px-6 py-10 text-center text-sm text-slate-500 shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/5 dark:text-blue-100/80">
        Cargando notificaciones…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200/70 bg-rose-50/80 px-6 py-4 text-sm text-rose-600 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-100">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200/60 bg-white/70 px-8 py-12 text-center text-slate-500 shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/5 dark:text-blue-100/80">
        <CalendarCheck2 className="mx-auto mb-4 h-12 w-12 text-slate-400 dark:text-blue-200/60" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-100">Sin notificaciones con los filtros actuales</h3>
        <p className="mt-2 text-sm">Ajusta la búsqueda o crea una nueva comunicación para el equipo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map(notification => {
        const priority = priorityStyles[notification.priority];
        const target = targetDescriptor(notification.target);
        const scheduled = notification.status === 'scheduled';
          const createdAt = formatDateTime(notification.createdAt);
          const scheduledAt = notification.scheduledAt ? formatDateTime(notification.scheduledAt) : null;

        return (
          <article
            key={notification.id}
            className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-6 text-slate-800 shadow-lg shadow-slate-200/40 transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:shadow-slate-900/40"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_rgba(15,23,42,0)_65%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.24),_rgba(15,23,42,0.45))]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${priority.badge}`}>
                    {priority.label}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur dark:bg-white/10 dark:text-blue-100">
                    {target.icon}
                    {target.text}
                  </span>
                  {scheduled && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm dark:bg-amber-500/15 dark:text-amber-200">
                      <CalendarCheck2 className="h-3.5 w-3.5" /> Programada
                    </span>
                  )}
                  {notification.pinned && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm dark:bg-indigo-500/15 dark:text-indigo-200">
                      <Pin className="h-3.5 w-3.5" /> Fijada
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{notification.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-blue-200/80 whitespace-pre-wrap">{notification.message}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 text-sm text-slate-500 dark:text-blue-200/80">
                <div className="rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/10">
                  <p>
                    Creada por <span className="font-semibold text-slate-800 dark:text-white">{notification.createdBy}</span>
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-blue-200/70">{createdAt}</p>
                  {scheduledAt && (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-200">
                      Envío programado: {scheduledAt}
                    </p>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onTogglePin(notification)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
                    >
                      {notification.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                      {notification.pinned ? 'Quitar fijación' : 'Fijar' }
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(notification)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
                    >
                      <Pencil className="h-4 w-4" /> Editar
                    </button>
                    {/* Acción de eliminar oculta por falta de endpoint DELETE en backend */}
                  </div>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default NotificationBoard;
