import React, { useId, useMemo, useState } from 'react';
import { TicketPriority } from '../../../types/Ticket';
import { useTicketsContext } from '../context/TicketsContext';

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

const DEFAULT_PRIORITY: TicketPriority = TicketPriority.Media;

export default function CreateTicketModal({ open, onClose }: Props) {
  const { create, items } = useTicketsContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<TicketPriority>(DEFAULT_PRIORITY);
  const [recipientArea, setRecipientArea] = useState<string[]>([]);
  const [tags, setTags] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const categoryId = useId();
  const priorityId = useId();
  const areasFieldsetId = useId();
  const tagsId = useId();

  const categories = useMemo(() => {
    const base = Array.from(new Set(items.map((t) => t.category)));
    return base.sort((a, b) => String(a).localeCompare(String(b)));
  }, [items]);

  const toggleArea = (area: string) => {
    setRecipientArea((prev) => prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]);
  };

  const validate = () => title.trim().length >= 3 && category.trim().length >= 2;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      await create({
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim(),
        priority,
        recipientArea: recipientArea.length ? recipientArea : undefined,
        tags: tags.split(',').map((s) => s.trim()).filter(Boolean),
      });
      // limpiar y cerrar
      setTitle('');
      setDescription('');
      setCategory('');
      setPriority(DEFAULT_PRIORITY);
      setRecipientArea([]);
      setTags('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const allAreas = ['IT', 'Transporte', 'Obras', 'Aseo', 'RRHH', 'Finanza', 'P_Riesgo'] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-lg bg-white dark:bg-slate-900 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Crear Ticket</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1" htmlFor={titleId}>Título</label>
            <input id={titleId} value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor={descriptionId}>Descripción</label>
            <textarea id={descriptionId} value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1" htmlFor={categoryId}>Categoría</label>
              <input id={categoryId} list="ticket-categories" value={category} onChange={(e) => setCategory(e.target.value)} required
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" />
              <datalist id="ticket-categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-sm mb-1" htmlFor={priorityId}>Prioridad</label>
              <select id={priorityId} value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700">
                {Object.values(TicketPriority).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <fieldset aria-labelledby={areasFieldsetId} className="border-0 p-0">
            <legend id={areasFieldsetId} className="block text-sm mb-2">Áreas destinatarias</legend>
            <div className="flex flex-wrap gap-2">
              {allAreas.map((a) => {
                const checkboxId = `${areasFieldsetId}-${a}`;
                return (
                  <div key={a} className="inline-flex items-center gap-2 text-sm">
                    <input id={checkboxId} type="checkbox" checked={recipientArea.includes(a)} onChange={() => toggleArea(a)} />
                    <label htmlFor={checkboxId}>{a}</label>
                  </div>
                );
              })}
            </div>
          </fieldset>
          <div>
            <label className="block text-sm mb-1" htmlFor={tagsId}>Tags (separados por coma)</label>
            <input id={tagsId} value={tags} onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border dark:border-slate-700">Cancelar</button>
            <button type="submit" disabled={!validate() || submitting}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60">{submitting ? 'Creando…' : 'Crear'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
