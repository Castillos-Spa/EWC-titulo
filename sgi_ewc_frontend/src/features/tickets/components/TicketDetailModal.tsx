import { useEffect, useMemo, useRef, useState } from 'react';
import { Ticket, TicketPriority, TicketStatus } from '../../../types/Ticket';
import { useTicketsContext } from '../context/TicketsContext';
import type { User } from '../../../types/User';
import { useIntlFormat } from '../../../app/intl/format';
import { useLanguage } from '../../../contexts/LanguageContext';
import { X, CalendarClock, User2, Tag, ShieldCheck, ShieldX, CheckCircle2, Loader2 } from 'lucide-react';
import { useTicketLabels } from '../labels';
import { useAuth } from '../../../contexts/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
  ticket: Ticket;
}

export default function TicketDetailModal({ open, onClose, ticket }: Readonly<Props>) {
  const { formatDateTime } = useIntlFormat();
  const { update, approve, users } = useTicketsContext();
  const { t } = useLanguage();
  const { statusLabel, priorityLabel } = useTicketLabels();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const { user } = useAuth();
  const isAssignedUser = user?.id === ticket.assignedTo?.id;
  const isRequestingUser = user?.id === ticket.createdBy?.id;
  const isAssignedDisabled = !isAssignedUser;
  const isRequestingDisabled = !isRequestingUser;
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
  const hasApprovals = approvals.length > 0;

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
      if (type === 'assigned') {
        // Solo el usuario asignado puede confirmar/desconfirmar
        if (user?.id !== ticket.assignedTo?.id) return;
        await update(ticket.id, { assignedUserConfirmation: value });
      } else {
        // Solo el creador del ticket puede confirmar/desconfirmar recepción
        if (user?.id !== ticket.createdBy?.id) return;
        await update(ticket.id, { requestingUserConfirmation: value });
      }
    } finally {
      setUpdatingConfirm(null);
    }
  };

  // Control del <dialog> nativo y propagación de cierre
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;

    const handleClose = () => {
      onClose();
    };
    dlg.addEventListener('close', handleClose);

    // Abrir/cerrar modal de forma controlada
    if (open) {
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }

    return () => {
      dlg.removeEventListener('close', handleClose);
    };
  }, [open, onClose]);

  const statusTone: Record<TicketStatus, string> = {
    [TicketStatus.Pendiente]: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100',
    [TicketStatus.EnProgreso]: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100',
    [TicketStatus.Resuelto]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100',
    [TicketStatus.Cerrado]: 'bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200',
  };
  const priorityTone: Record<TicketPriority, string> = {
    [TicketPriority.Baja]: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100',
    [TicketPriority.Media]: 'bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100',
    [TicketPriority.Alta]: 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100',
    [TicketPriority.Urgente]: 'bg-rose-50 text-rose-700 dark:bg-rose-500/25 dark:text-rose-100',
  };

  return (
    <dialog ref={dialogRef} aria-labelledby="ticket-detail-title" className="relative w-full max-w-5xl max-h-[calc(100vh-3rem)] overflow-y-auto rounded-3xl border border-slate-200/60 bg-white shadow-2xl shadow-slate-900/30 backdrop:backdrop-blur-sm dark:border-white/10 dark:bg-slate-950">
        {/* Header */}
        <header className="relative overflow-hidden border-b border-slate-200/60 bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-500 px-6 py-5 text-white dark:border-white/10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_70%)]" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 id="ticket-detail-title" className="text-xl font-semibold">{t('tickets.detail.ticket')} #{ticket.id}</h3>
              <p className="text-sm text-white/85">{ticket.category}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${statusTone[status]}`}>{statusLabel(status)}</span>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${priorityTone[priority]}`}>{priorityLabel(priority)}</span>
              <button type="button" onClick={() => dialogRef.current?.close()} className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25">
                <X className="h-5 w-5" />
                <span className="sr-only">{t('common.close')}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="grid gap-6 p-6 md:grid-cols-[1.2fr,0.8fr]">
          {/* Left column: content */}
          <div className="space-y-6">
            {/* Title and description */}
            <section className="space-y-3">
              <div>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-blue-200/70">{t('common.title')}</span>
                <p className="text-base font-semibold text-slate-900 dark:text-white">{ticket.title}</p>
              </div>
              {ticket.description ? (
                <div>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-blue-200/70">{t('tickets.description')}</span>
                  <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{ticket.description}</p>
                </div>
              ) : null}
            </section>

            {/* Editable controls */}
            <section className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-blue-200/70">
                <span>{t('tickets.detail.status')}</span>
                <select
                  id="ticket-status"
                  value={status}
                  onChange={(e) => {
                    const allowed = Object.values(TicketStatus) as ReadonlyArray<TicketStatus>;
                    const v = e.target.value as TicketStatus;
                    setStatus(allowed.includes(v) ? v : ticket.status);
                  }}
                  disabled={hasApprovals}
                  title={hasApprovals ? 'El estado es controlado por las aprobaciones activas' : undefined}
                  className={`rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-200/60 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30 ${hasApprovals ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {Object.values(TicketStatus).map((s) => (
                    <option key={s} value={s}>{statusLabel(s)}</option>
                  ))}
                </select>
                {hasApprovals && (
                  <span aria-hidden="true" className="text-[11px] font-normal normal-case tracking-normal text-slate-500 dark:text-slate-400">
                    Estado gestionado por aprobaciones; cambia desde el flujo de aprobación.
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-blue-200/70">
                <span>{t('tickets.detail.priority')}</span>
                <select
                  id="ticket-priority"
                  value={priority}
                  onChange={(e) => {
                    const allowed = Object.values(TicketPriority) as ReadonlyArray<TicketPriority>;
                    const v = e.target.value as TicketPriority;
                    setPriority(allowed.includes(v) ? v : ticket.priority);
                  }}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-200/60 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                >
                  {Object.values(TicketPriority).map((p) => (
                    <option key={p} value={p}>{priorityLabel(p)}</option>
                  ))}
                </select>
              </label>
            </section>

            {/* Assignment */}
            <section className="grid gap-3 sm:grid-cols-[1fr,auto]">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-blue-200/70">
                <span>{t('tickets.detail.assignTo')}</span>
                <select
                  id="ticket-assign"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-200/60 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                >
                  <option value="">— {t('tickets.unassigned')} —</option>
                  {assignableUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={onAssign}
                  disabled={!assigneeId || updatingAssign}
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200/60 transition hover:-translate-y-0.5 hover:bg-indigo-500 disabled:opacity-60"
                >
                  {updatingAssign && <Loader2 className="h-4 w-4 animate-spin" />} {updatingAssign ? t('tickets.detail.assigning') : t('tickets.detail.assign')}
                </button>
              </div>
            </section>

            {/* Confirmations */}
            <section className="grid gap-3 sm:grid-cols-2">
              <label className={`inline-flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-3 text-sm text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200 ${isAssignedDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={!!ticket.assignedUserConfirmation}
                  onChange={(e) => onToggleConfirmation('assigned', e.target.checked)}
                  disabled={updatingConfirm === 'assigned' || isAssignedDisabled}
                  title={isAssignedDisabled ? t('common.inactive') : undefined}
                />
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> {t('tickets.detail.assignedUserConfirmation')}</span>
                {isAssignedDisabled && (
                  <span aria-hidden="true" className="ml-auto text-xs text-slate-500 dark:text-slate-400">Solo el usuario asignado puede confirmar</span>
                )}
              </label>
              <label className={`inline-flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-3 text-sm text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200 ${isRequestingDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={!!ticket.requestingUserConfirmation}
                  onChange={(e) => onToggleConfirmation('requesting', e.target.checked)}
                  disabled={updatingConfirm === 'requesting' || isRequestingDisabled}
                  title={isRequestingDisabled ? t('common.inactive') : undefined}
                />
                <span className="inline-flex items-center gap-2"><ShieldX className="h-4 w-4" /> {t('tickets.detail.requestingUserConfirmation')}</span>
                {isRequestingDisabled && (
                  <span aria-hidden="true" className="ml-auto text-xs text-slate-500 dark:text-slate-400">Solo el creador del ticket puede confirmar</span>
                )}
              </label>
            </section>

            {/* Approvals */}
            {approvals.length > 0 && (
              <section className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-blue-200/70">{t('tickets.detail.approvals')}</h4>
                <div className="grid gap-3">
                  {approvals.map((ap) => {
                    const isPending = ap.status === 'Pendiente';
                    return (
                      <div key={ap.id} className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-slate-900/50">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-sm text-slate-700 dark:text-slate-200">
                            {t('tickets.detail.step')} {ap.step} • {ap.approverRole} • {ap.approverArea}
                          </div>
                          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                            {ap.status}
                          </div>
                        </div>
                        {isPending && (
                          <div className="mt-3 flex items-center gap-2">
                            <input
                              id={`approval-comment-${ap.id}`}
                              placeholder={t('tickets.detail.commentOptional')}
                              value={approvalComment}
                              onChange={(e) => setApprovalComment(e.target.value)}
                              className="flex-1 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner shadow-slate-200/60 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                            />
                            <button type="button" onClick={() => onApprovalAction(ap.id, true)} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"><CheckCircle2 className="h-4 w-4" /> {t('tickets.detail.approve')}</button>
                            <button type="button" onClick={() => onApprovalAction(ap.id, false)} className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500">{t('tickets.detail.reject')}</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Tags */}
            <section className="space-y-2">
              <label htmlFor="ticket-tags" className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-blue-200/70">{t('tickets.detail.tags')}</label>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-400" />
                <input
                  id="ticket-tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner shadow-slate-200/60 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                />
              </div>
            </section>
          </div>

          {/* Right column: info card */}
          <aside className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/50">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-blue-200/70">{t('common.details')}</div>
              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                <div className="flex items-center gap-2"><User2 className="h-4 w-4" /><span className="text-slate-500">{t('tickets.detail.createdBy')}</span><span className="ml-auto font-medium">{ticket.createdBy?.username ?? '—'}</span></div>
                <div className="flex items-center gap-2"><User2 className="h-4 w-4" /><span className="text-slate-500">{t('tickets.detail.assignedTo')}</span><span className="ml-auto font-medium">{ticket.assignedTo?.username ?? '—'}</span></div>
                <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /><span className="text-slate-500">{t('tickets.detail.createdAt')}</span><span className="ml-auto font-medium">{formatDateTime(ticket.createdAt)}</span></div>
                <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /><span className="text-slate-500">{t('tickets.detail.updatedAt')}</span><span className="ml-auto font-medium">{formatDateTime(ticket.updatedAt)}</span></div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/50">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-blue-200/70">{t('tickets.detail.recipientAreas')}</div>
              <div className="flex flex-wrap gap-2">
                {(ticket.recipientArea ?? []).length === 0 ? (
                  <span className="text-xs text-slate-500">{t('tickets.noMatches')}</span>
                ) : (
                  (ticket.recipientArea ?? []).map((a) => (
                    <span key={a} className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">{a}</span>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <footer className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-slate-200/60 bg-white/90 px-6 py-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
          <button type="button" onClick={() => dialogRef.current?.close()} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            {t('common.close')}
          </button>
          <button type="button" onClick={onSave} disabled={!canSave || saving} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200/60 transition hover:-translate-y-0.5 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} {saving ? t('common.saving') : t('common.save')}
          </button>
        </footer>
    </dialog>
  );
}
