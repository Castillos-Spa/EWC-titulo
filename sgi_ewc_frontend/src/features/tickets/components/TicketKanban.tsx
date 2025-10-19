import React, { useMemo } from 'react';
import { CalendarClock, ChevronRight, MessageSquare, UserCircle } from 'lucide-react';
import type { Ticket } from '../../../types/Ticket';
import { TicketPriority, TicketStatus } from '../../../types/Ticket';

interface TicketKanbanProps {
  items: Ticket[];
  onSelect: (ticket: Ticket) => void;
  statuses?: TicketStatus[];
}

const STATUS_ORDER: TicketStatus[] = [
  TicketStatus.Pendiente,
  TicketStatus.EnProgreso,
  TicketStatus.Resuelto,
  TicketStatus.Cerrado,
];

const statusTone: Record<TicketStatus, string> = {
  [TicketStatus.Pendiente]: 'from-amber-500/25 to-orange-500/25',
  [TicketStatus.EnProgreso]: 'from-sky-500/25 to-blue-500/25',
  [TicketStatus.Resuelto]: 'from-emerald-500/25 to-teal-500/25',
  [TicketStatus.Cerrado]: 'from-slate-500/25 to-slate-600/25',
};

const priorityTone: Record<TicketPriority, string> = {
  [TicketPriority.Baja]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100',
  [TicketPriority.Media]: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100',
  [TicketPriority.Alta]: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100',
  [TicketPriority.Urgente]: 'bg-rose-100 text-rose-700 dark:bg-rose-500/25 dark:text-rose-100',
};

const formatTicketDate = (value?: string | Date) => {
  if (!value) return 'Sin fecha';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CL', { month: 'short', day: '2-digit' }).format(parsed);
};

const TicketKanban: React.FC<TicketKanbanProps> = ({ items, onSelect, statuses = STATUS_ORDER }) => {
  const grouped = useMemo(() => {
    return statuses.map(status => ({
      status,
      tickets: items.filter(ticket => ticket.status === status),
    }));
  }, [items, statuses]);

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {grouped.map(column => (
        <article
          key={column.status}
          className="relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-5 text-slate-800 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:shadow-slate-900/30"
        >
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${statusTone[column.status]}`} />
          <div className="relative flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-600 dark:text-blue-200/70">{column.status}</h3>
              <p className="text-xs text-slate-500 dark:text-blue-200/60">{column.tickets.length} ticket(s)</p>
            </div>
          </div>
          <div className="relative flex-1 space-y-3 overflow-y-auto pr-1">
            {column.tickets.length === 0 ? (
              <div className="rounded-2xl border border-white/60 bg-white/70 p-4 text-xs text-slate-500 shadow-inner shadow-slate-200/50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Nada por aquí todavía.
              </div>
            ) : (
              column.tickets.map(ticket => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => onSelect(ticket)}
                  className="group flex w-full flex-col gap-3 rounded-2xl border border-white/70 bg-white/80 p-4 text-left shadow-sm shadow-slate-200/60 transition hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-md dark:border-white/10 dark:bg-slate-900/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{ticket.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">#{ticket.id}</p>
                    </div>
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${priorityTone[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  {ticket.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 dark:text-slate-300">{ticket.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1">
                      <UserCircle className="h-3.5 w-3.5" />
                      {ticket.assignedTo?.username ?? 'Sin asignar'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatTicketDate(ticket.updatedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {ticket.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-end text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 transition group-hover:text-sky-500 dark:text-slate-500">
                    Revisar
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </button>
              ))
            )}
          </div>
        </article>
      ))}
    </div>
  );
};

export default TicketKanban;
