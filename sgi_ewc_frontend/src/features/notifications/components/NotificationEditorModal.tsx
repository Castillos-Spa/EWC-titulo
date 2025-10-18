import React, { useEffect, useMemo, useState } from 'react';
import { X, Send, Globe2, Users2 } from 'lucide-react';
import type { AppNotification, CreateNotificationPayload, NotificationTarget, NotificationPriority } from '../../../types/Notification';

type ScopeOption = 'global' | 'areas';

type NotificationEditorModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  areas: string[];
  initial?: AppNotification | null;
  onClose: () => void;
  onSubmit: (payload: CreateNotificationPayload) => Promise<void>;
};

const normalizeScope = (target: NotificationTarget | undefined): ScopeOption => {
  if (!target) return 'global';
  if (target.scope === 'areas') return 'areas';
  if (target.scope === 'roles') return 'areas';
  return 'global';
};

const toInputDateTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const NotificationEditorModal: React.FC<NotificationEditorModalProps> = ({
  open,
  mode,
  areas,
  initial,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<NotificationPriority>('normal');
  const [scope, setScope] = useState<ScopeOption>('global');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submitLabel = useMemo(() => {
    if (submitting) return 'Guardando…';
    if (mode === 'edit') return 'Guardar cambios';
    return 'Enviar notificación';
  }, [mode, submitting]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    globalThis.addEventListener('keydown', handler);
    return () => globalThis.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const nextScope = normalizeScope(initial?.target);
    setScope(nextScope);
    setTitle(initial?.title ?? '');
    setMessage(initial?.message ?? '');
    setPriority(initial?.priority ?? 'normal');
    setScheduledAt(toInputDateTime(initial?.scheduledAt));
    if (initial?.target && nextScope === 'areas') {
      if (initial.target.scope === 'areas') setSelectedAreas(initial.target.areas);
      else if (initial.target.scope === 'roles') setSelectedAreas(initial.target.roles);
      else setSelectedAreas([]);
    } else {
      setSelectedAreas([]);
    }
    setError(null);
  }, [open, initial]);

  useEffect(() => {
    if (!open && mode === 'create') {
      setTitle('');
      setMessage('');
      setPriority('normal');
      setScope('global');
      setSelectedAreas([]);
      setScheduledAt('');
      setError(null);
    }
  }, [open, mode]);

  const modalTitle = useMemo(() => {
    if (mode === 'edit' && initial) return `Editar ${initial.title}`;
    return 'Nueva notificación';
  }, [mode, initial]);

  const toggleArea = (value: string) => {
    setSelectedAreas(prev => (
      prev.includes(value) ? prev.filter(area => area !== value) : [...prev, value]
    ));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();

    if (!trimmedTitle || !trimmedMessage) {
      setError('Completa título y mensaje para continuar.');
      return;
    }
    if (scope === 'areas' && selectedAreas.length === 0) {
      setError('Selecciona al menos un área para esta notificación.');
      return;
    }

    const payload: CreateNotificationPayload = {
      title: trimmedTitle,
      message: trimmedMessage,
      priority,
      target: scope === 'areas' ? { scope: 'areas', areas: selectedAreas } : { scope: 'global' },
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    };

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(payload);
      if (mode === 'create') {
        setTitle('');
        setMessage('');
        setSelectedAreas([]);
        setScheduledAt('');
        setScope('global');
      }
    } catch (err) {
      console.error(err);
      setError('No pudimos guardar la notificación. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-10 backdrop-blur">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-8 text-slate-800 shadow-2xl shadow-slate-300/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_rgba(191,219,254,0.08))] dark:bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.25),_rgba(15,23,42,0.4))]" />
        <div className="relative flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400 dark:text-blue-200/70">
              {mode === 'edit' ? 'Actualización' : 'Nuevo aviso'}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{modalTitle}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-blue-200/80">
              Diseña mensajes consistentes con el nuevo lenguaje visual y mantén informadas a las áreas correctas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-blue-100"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative mt-8 space-y-6">
          <fieldset className="space-y-3 rounded-3xl border border-slate-200/60 bg-white/70 p-4 shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/5 dark:shadow-black/40">
            <legend className="px-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Audiencia</legend>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setScope('global')}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${scope === 'global' ? 'border-sky-300 bg-white/90 text-slate-800 shadow-sm shadow-sky-200/40 dark:border-sky-500/40 dark:bg-white/10 dark:text-white' : 'border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-blue-100'}`}
              >
                <Globe2 className="h-4 w-4" /> Global
              </button>
              <button
                type="button"
                onClick={() => setScope('areas')}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${scope === 'areas' ? 'border-sky-300 bg-white/90 text-slate-800 shadow-sm shadow-sky-200/40 dark:border-sky-500/40 dark:bg-white/10 dark:text-white' : 'border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-blue-100'}`}
              >
                <Users2 className="h-4 w-4" /> Por áreas
              </button>
            </div>
            {scope === 'areas' && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {areas.map(area => {
                  const checked = selectedAreas.includes(area);
                  return (
                    <label
                      key={area}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-2 text-sm transition ${checked ? 'border-sky-300 bg-white/90 shadow-sm shadow-sky-200/40 dark:border-sky-500/40 dark:bg-white/10 dark:text-white' : 'border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-blue-100'}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleArea(area)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400 dark:border-white/20 dark:bg-white/10"
                      />
                      <span className="font-semibold capitalize">{area}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="notification-title" className="mb-2 block text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Título</label>
              <input
                id="notification-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Nuevo protocolo logístico"
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="notification-priority" className="mb-2 block text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Prioridad</label>
              <select
                id="notification-priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value as NotificationPriority)}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
              >
                <option value="low">Baja</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="notification-message" className="mb-2 block text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Mensaje</label>
            <textarea
              id="notification-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              placeholder="Describe el anuncio con claridad y agrega acciones a seguir."
              className="h-40 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-800 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="notification-scheduled" className="mb-2 block text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Programar envío (opcional)</label>
            <input
              id="notification-scheduled"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-600 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-100">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-200/70 pt-5 text-sm dark:border-white/10 md:flex-row md:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-5 py-2 font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-6 py-2 font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5 ${submitting ? 'opacity-60' : ''}`}
              disabled={submitting}
            >
              <Send className="h-4 w-4" />
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationEditorModal;
