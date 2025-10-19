import React, { useMemo } from 'react';
import { AlertTriangle, ClipboardCheck, Hourglass, Sparkles } from 'lucide-react';
import type { Ticket } from '../../../types/Ticket';
import { TicketPriority, TicketStatus } from '../../../types/Ticket';

interface TicketKpisProps {
  items: Ticket[];
  loading?: boolean;
}

interface StatDescriptor {
  id: string;
  label: string;
  value: string;
  helper: string;
  accent: string;
  icon: React.ReactNode;
}

const TicketKpis: React.FC<TicketKpisProps> = ({ items, loading = false }) => {
  const stats = useMemo<StatDescriptor[]>(() => {
    const pending = items.filter(ticket => ticket.status === TicketStatus.Pendiente).length;
    const inProgress = items.filter(ticket => ticket.status === TicketStatus.EnProgreso).length;
    const urgent = items.filter(ticket => ticket.priority === TicketPriority.Urgente).length;
    const sevenDays = 1000 * 60 * 60 * 24 * 7;
    const now = Date.now();
    const resolvedThisWeek = items.filter(ticket => {
      if (!ticket.updatedAt) return false;
      const timestamp = Date.parse(ticket.updatedAt);
      if (Number.isNaN(timestamp)) return false;
      const diff = now - timestamp;
      return diff <= sevenDays && (ticket.status === TicketStatus.Resuelto || ticket.status === TicketStatus.Cerrado);
    }).length;

    return [
      {
        id: 'tickets-pending',
        label: 'Pendientes',
        value: String(pending),
        helper: `${items.length} totales en la bandeja`,
        accent: 'from-amber-500/25 via-orange-500/20 to-amber-400/25',
        icon: <Hourglass className="h-5 w-5" />,
      },
      {
        id: 'tickets-progress',
        label: 'En progreso',
        value: String(inProgress),
        helper: inProgress > 0 ? 'Coordinando equipos asignados' : 'No hay tickets en ejecución',
        accent: 'from-sky-500/25 via-blue-500/20 to-sky-400/25',
  icon: <ClipboardCheck className="h-5 w-5" />,
      },
      {
        id: 'tickets-urgent',
        label: 'Urgentes',
        value: String(urgent),
        helper: urgent > 0 ? 'Prioriza estos casos críticos' : 'Sin alertas críticas',
        accent: 'from-rose-500/25 via-red-500/20 to-rose-400/25',
        icon: <AlertTriangle className="h-5 w-5" />,
      },
      {
        id: 'tickets-resolved-week',
        label: 'Resueltos semana',
        value: String(resolvedThisWeek),
        helper: resolvedThisWeek > 0 ? 'Flujo saludable de cierres' : 'Aún sin cierres recientes',
        accent: 'from-emerald-500/25 via-teal-500/20 to-emerald-400/25',
        icon: <Sparkles className="h-5 w-5" />,
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
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-slate-700 shadow-sm backdrop-blur dark:bg-white/10 dark:text-slate-100">
              {stat.icon}
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{stat.label}</p>
            <p className="text-3xl font-semibold tracking-tight">
              {loading ? '…' : stat.value}
            </p>
            <p className="text-sm text-slate-500 dark:text-blue-200/80">{stat.helper}</p>
          </div>
        </article>
      ))}
    </section>
  );
};

export default TicketKpis;
