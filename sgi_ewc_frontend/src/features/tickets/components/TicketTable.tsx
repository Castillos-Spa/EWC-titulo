import React from 'react';
import { CalendarClock, UserCircle } from 'lucide-react';
import type { Ticket } from '../../../types/Ticket';
import { TicketPriority, TicketStatus } from '../../../types/Ticket';
import { useIntlFormat } from '../../../app/intl/format';

interface TicketTableProps {
  items: Ticket[];
  onSelect: (ticket: Ticket) => void;
}

const statusBadge: Record<TicketStatus, string> = {
  [TicketStatus.Pendiente]: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100',
  [TicketStatus.EnProgreso]: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100',
  [TicketStatus.Resuelto]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100',
  [TicketStatus.Cerrado]: 'bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200',
};

const priorityBadge: Record<TicketPriority, string> = {
  [TicketPriority.Baja]: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100',
  [TicketPriority.Media]: 'bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100',
  [TicketPriority.Alta]: 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100',
  [TicketPriority.Urgente]: 'bg-rose-50 text-rose-700 dark:bg-rose-500/25 dark:text-rose-100',
};

const TicketTable: React.FC<TicketTableProps> = ({ items, onSelect }) => {
  const { formatDateTime } = useIntlFormat();
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_70%)]" />
      <div className="relative overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
          <thead className="bg-white/70 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:bg-white/5 dark:text-blue-200/70">
            <tr>
              <th className="px-5 py-4">ID</th>
              <th className="px-5 py-4">Título</th>
              <th className="px-5 py-4">Estado</th>
              <th className="px-5 py-4">Prioridad</th>
              <th className="px-5 py-4">Categoría</th>
              <th className="px-5 py-4">Asignado</th>
              <th className="px-5 py-4">Actualizado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 dark:divide-white/5">
            {items.map(ticket => (
              <tr
                key={ticket.id}
                onClick={() => onSelect(ticket)}
                className="cursor-pointer bg-white/60 transition hover:bg-sky-50 dark:bg-white/5 dark:hover:bg-slate-800/60"
              >
                <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-600 dark:text-slate-100">#{ticket.id}</td>
                <td className="max-w-sm px-5 py-4 text-slate-700 dark:text-slate-200">
                  <div className="font-medium text-slate-800 dark:text-slate-100">{ticket.title}</div>
                  {ticket.description && (
                    <p className="text-xs text-slate-500 line-clamp-1 dark:text-slate-300">{ticket.description}</p>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${statusBadge[ticket.status]}`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${priorityBadge[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-600 dark:text-slate-200">{ticket.category}</td>
                <td className="px-5 py-4 text-slate-600 dark:text-slate-200">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-300">
                    <UserCircle className="h-4 w-4" />
                    {ticket.assignedTo?.username ?? 'Sin asignar'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-300">
                    <CalendarClock className="h-4 w-4" />
                    {formatDateTime(ticket.updatedAt) || 'Sin fecha'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 && (
        <div className="relative px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-300">
          No hay tickets para mostrar con los filtros actuales.
        </div>
      )}
    </div>
  );
};

export default TicketTable;
