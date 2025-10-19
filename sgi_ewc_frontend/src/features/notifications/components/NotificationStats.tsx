import React, { useMemo } from 'react';
import { Bell, Globe2, Users2, Clock, Pin } from 'lucide-react';
import type { AppNotification } from '../../../types/Notification';

interface NotificationStatsProps {
  items: AppNotification[];
  loading: boolean;
}

const NotificationStats: React.FC<NotificationStatsProps> = ({ items, loading }) => {
  const stats = useMemo(() => {
    const total = items.length;
    const globalCount = items.filter(n => n.target.scope === 'global').length;
    const areaCount = items.filter(n => n.target.scope === 'areas').length;
    const scheduledCount = items.filter(n => n.status === 'scheduled').length;
    const pinnedCount = items.filter(n => n.pinned).length;

    return [
      {
        id: 'notifications-total',
        label: 'Publicadas',
        value: total,
        helper: `${pinnedCount} fijadas`,
        icon: <Bell className="h-6 w-6" />,
        accent: 'from-indigo-500/25 to-sky-500/20',
      },
      {
        id: 'notifications-global',
        label: 'Globales',
        value: globalCount,
        helper: total === 0 ? '—' : `${Math.round((globalCount / total) * 100)}% del total`,
        icon: <Globe2 className="h-6 w-6" />,
        accent: 'from-emerald-500/25 to-teal-500/20',
      },
      {
        id: 'notifications-areas',
        label: 'Dirigidas por áreas',
        value: areaCount,
        helper: total === 0 ? '—' : `${Math.round((areaCount / total) * 100)}% segmentadas`,
        icon: <Users2 className="h-6 w-6" />,
        accent: 'from-purple-500/25 to-pink-500/20',
      },
      {
        id: 'notifications-scheduled',
        label: 'Programadas',
        value: scheduledCount,
        helper: scheduledCount > 0 ? 'Envía recordatorios a tiempo' : 'Todas entregadas',
        icon: scheduledCount > 0 ? <Clock className="h-6 w-6" /> : <Pin className="h-6 w-6" />,
        accent: 'from-amber-500/25 to-orange-500/20',
      },
    ];
  }, [items]);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map(stat => (
        <article
          key={stat.id}
          className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-6 text-slate-800 shadow-lg shadow-slate-200/50 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:shadow-slate-900/40"
        >
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${stat.accent}`} />
          <div className="relative flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{stat.label}</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-slate-700 shadow-sm backdrop-blur dark:bg-white/10 dark:text-blue-100">
                {stat.icon}
              </span>
            </div>
            <div className="text-3xl font-semibold tracking-tight">{loading ? '—' : stat.value}</div>
            <p className="text-sm text-slate-500 dark:text-blue-200/80">{stat.helper}</p>
          </div>
        </article>
      ))}
    </section>
  );
};

export default NotificationStats;
