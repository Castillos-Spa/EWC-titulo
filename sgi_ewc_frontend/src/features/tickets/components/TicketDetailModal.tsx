import { useMemo, useState } from 'react';
import { Ticket, TicketPriority, TicketStatus } from '../../../types/Ticket';
import { useTicketsContext } from '../context/TicketsContext';
import type { User } from '../../../types/User';
import { useIntlFormat } from '../../../app/intl/format';

interface Props {
  open: boolean;
  onClose: () => void;
  ticket: Ticket;
}

function useFormatters() {
  const { formatDateTime } = useIntlFormat();
  return { formatDateTime };
}

export default function TicketDetailModal({ open, onClose, ticket }: Readonly<Props>) {
  const { formatDateTime } = useFormatters();
  const { update, approve, users } = useTicketsContext();
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority);
  const [tags, setTags] = useState<string>(ticket.tags?.join(', ') ?? '');
  const [saving, setSaving] = useState(false);
  const [assigneeId, setAssigneeId] = useState<string>(ticket.assignedTo?.id ? String(ticket.assignedTo.id) : '');
  const [approvalComment, setApprovalComment] = useState('');
  const [updatingAssign, setUpdatingAssign] = useState(false);
  const [updatingConfirm, setUpdatingConfirm] = useState<'assigned' | 'requesting' | null>(null);

  const canSave = useMemo(() => {
    return status !== ticket.status || priority !== ticket.priority || tags.trim() !== (ticket.tags?.join(', ') ?? '');
  }, [status, priority, tags, ticket]);

  const onSave = async () => {
    try {
      setSaving(true);
      const newTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      await update(ticket.id, { status, priority, tags: newTags });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  type ApprovalStatus = 'Pendiente' | 'Aprobado' | 'Rechazado';
  interface Approval { id: number; status: ApprovalStatus; approverRole: string; approverArea: string; approvedBy?: { username: string }; approvedAt?: string; step: number }
  const approvals: Approval[] = (ticket as unknown as { approvals?: Approval[] }).approvals ?? [];

  const assignableUsers: User[] = useMemo(() => {
    const areas = new Set(ticket.recipientArea ?? []);
    return users.filter((u) => {
      const ras = u.roleAssignments ?? [];
      for (const ra of ras) {
        if (ra.isActive && areas.has(ra.area)) return true;
      }
      return false;
    });
  }, [users, ticket]);

  const onAssign = async () => {
    if (!assigneeId) return;
    try {
      setUpdatingAssign(true);
      await update(ticket.id, { assignedToId: Number.parseInt(assigneeId, 10), status: TicketStatus.EnProgreso });
    } finally {
      setUpdatingAssign(false);
    }
  };

  const onApprovalAction = async (approvalId: number, approved: boolean) => {
    await approve(ticket.id, approvalId, approved, approvalComment || undefined);
    setApprovalComment('');
  };

  const onToggleConfirmation = async (type: 'assigned' | 'requesting', value: boolean) => {
    try {
      setUpdatingConfirm(type);
      if (type === 'assigned') await update(ticket.id, { assignedUserConfirmation: value });
      else await update(ticket.id, { requestingUserConfirmation: value });
    } finally {
      setUpdatingConfirm(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-slate-900 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Ticket #{ticket.id}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-500">Título</div>
            <div className="font-medium">{ticket.title}</div>
          </div>
          {ticket.description && (
            <div>
              <div className="text-sm text-gray-500">Descripción</div>
              <div className="whitespace-pre-wrap">{ticket.description}</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="ticket-status" className="block text-sm mb-1">Estado</label>
              <select id="ticket-status" value={status} onChange={(e) => {
                const allowed = Object.values(TicketStatus) as ReadonlyArray<TicketStatus>;
                const v = e.target.value as TicketStatus;
                setStatus(allowed.includes(v) ? v : ticket.status);
              }} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700">
                {Object.values(TicketStatus).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="ticket-priority" className="block text-sm mb-1">Prioridad</label>
              <select id="ticket-priority" value={priority} onChange={(e) => {
                const allowed = Object.values(TicketPriority) as ReadonlyArray<TicketPriority>;
                const v = e.target.value as TicketPriority;
                setPriority(allowed.includes(v) ? v : ticket.priority);
              }} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700">
                {Object.values(TicketPriority).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <div className="text-sm text-gray-500">Categoría</div>
              <div className="font-medium">{ticket.category}</div>
            </div>
          </div>

          {/* Asignación */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="ticket-assign" className="block text-sm mb-1">Asignar a</label>
              <select id="ticket-assign" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700">
                <option value="">— Sin asignar —</option>
                {assignableUsers.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="button" onClick={onAssign} disabled={!assigneeId || updatingAssign}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-60 w-full">{updatingAssign ? 'Asignando…' : 'Asignar'}</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-sm text-gray-500">Creado por</div>
              <div className="font-medium">{ticket.createdBy?.username}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Asignado a</div>
              <div className="font-medium">{ticket.assignedTo?.username ?? '—'}</div>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500">Áreas destinatarias</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {(ticket.recipientArea ?? []).map((a) => (
                <span key={a} className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-slate-800">{a}</span>
              ))}
            </div>
          </div>

          {/* Confirmaciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!ticket.assignedUserConfirmation} onChange={(e) => onToggleConfirmation('assigned', e.target.checked)} disabled={updatingConfirm === 'assigned'} />
              <span>Confirmación usuario asignado</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!ticket.requestingUserConfirmation} onChange={(e) => onToggleConfirmation('requesting', e.target.checked)} disabled={updatingConfirm === 'requesting'} />
              <span>Confirmación usuario solicitante</span>
            </label>
          </div>

          {/* Aprobaciones */}
          {approvals.length > 0 && (
            <div className="space-y-2">
              <div className="font-medium">Aprobaciones</div>
              <div className="space-y-2">
                {approvals.map((ap) => (
                  <div key={ap.id} className="p-3 rounded-lg border dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">Paso {ap.step} • {ap.approverRole} • {ap.approverArea}</div>
                      <div className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-slate-800">{ap.status}</div>
                    </div>
                    {ap.status === 'Pendiente' && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          id={`approval-comment-${ap.id}`}
                          placeholder="Comentario (opcional)"
                          value={approvalComment}
                          onChange={(e) => setApprovalComment(e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700"
                        />
                        <button type="button" onClick={() => onApprovalAction(ap.id, true)} className="px-3 py-2 rounded-lg bg-green-600 text-white">Aprobar</button>
                        <button type="button" onClick={() => onApprovalAction(ap.id, false)} className="px-3 py-2 rounded-lg bg-red-600 text-white">Rechazar</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="ticket-tags" className="block text-sm mb-1">Tags</label>
            <input id="ticket-tags" value={tags} onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-500">
            <div>Creado: {formatDateTime(ticket.createdAt)}</div>
            <div>Actualizado: {formatDateTime(ticket.updatedAt)}</div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border dark:border-slate-700">Cerrar</button>
            <button type="button" onClick={onSave} disabled={!canSave || saving}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60">{saving ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
