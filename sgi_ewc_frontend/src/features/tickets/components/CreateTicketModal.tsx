import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Check, Laptop2, Package, ShieldAlert, Sparkles, Wrench, X } from 'lucide-react';
import { TicketPriority } from '../../../types/Ticket';
import { useTicketsContext } from '../context/TicketsContext';
import { useLanguage } from '../../../contexts/LanguageContext';

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

const DEFAULT_PRIORITY: TicketPriority = TicketPriority.Media;

type CategoryOption = {
  readonly value: string;
  readonly label: string;
  readonly description: string;
  readonly accent: string;
  readonly icon: LucideIcon;
};

const PRESET_CATEGORY_OPTIONS: readonly CategoryOption[] = [
  {
    value: 'Soporte IT',
    label: 'Soporte IT',
    description: 'Incidencias de hardware, software y accesos de usuarios.',
    accent: 'from-indigo-500 via-sky-500 to-cyan-500',
    icon: Laptop2,
  },
  {
    value: 'Solicitud Suministro',
    label: 'Solicitud de suministro',
    description: 'Requerimientos de materiales, repuestos o insumos.',
    accent: 'from-amber-500 via-orange-500 to-rose-500',
    icon: Package,
  },
  {
    value: 'Mantenimiento',
    label: 'Mantenimiento',
    description: 'Reparaciones programadas o correctivas en equipos.',
    accent: 'from-emerald-500 via-teal-500 to-cyan-500',
    icon: Wrench,
  },
  {
    value: 'Reporte Incidente',
    label: 'Reporte de incidente',
    description: 'Eventos riesgosos o de seguridad que deben registrarse.',
    accent: 'from-rose-500 via-fuchsia-500 to-purple-500',
    icon: ShieldAlert,
  },
];

const AREA_LABELS: Record<string, string> = {
  IT: 'IT',
  Transporte: 'Transporte',
  Obras: 'Obras',
  Aseo: 'Aseo',
  RRHH: 'RRHH',
  Finanza: 'Finanzas',
  P_Riesgo: 'Prev. Riesgo',
};

export default function CreateTicketModal({ open, onClose }: Props) {
  const { create, items } = useTicketsContext();
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<TicketPriority>(DEFAULT_PRIORITY);
  const [recipientArea, setRecipientArea] = useState<string[]>([]);
  const [tags, setTags] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const titleId = useId();
  const descriptionId = useId();
  const categoryId = useId();
  const priorityId = useId();
  const areasFieldsetId = useId();
  const tagsId = useId();

  const categoriesFromTickets = useMemo(() => {
    return items
      .map((ticket) => (ticket.category ?? '').split('_').join(' ').trim())
      .filter((value) => value.length > 0);
  }, [items]);

  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    const normalize = (value: string) => value.toLocaleLowerCase('es');

    const dynamicOptions = categoriesFromTickets
      .filter((value) => {
        const normalized = normalize(value);
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return !PRESET_CATEGORY_OPTIONS.some((option) => normalize(option.value) === normalized);
      })
      .map<CategoryOption>((value) => ({
        value,
        label: value,
        description: 'Categoría registrada previamente en la plataforma.',
        accent: 'from-slate-500 via-slate-600 to-slate-700',
        icon: Sparkles,
      }));

    return [...PRESET_CATEGORY_OPTIONS, ...dynamicOptions];
  }, [categoriesFromTickets]);

  const isCategorySelected = (value: string) => value.localeCompare(category, undefined, { sensitivity: 'base' }) === 0;

  const handleSelectCategory = (value: string) => {
    const alreadySelected = isCategorySelected(value);
    if (alreadySelected) {
      setCategory('');
      setCustomCategory('');
    } else {
      setCategory(value);
      setCustomCategory('');
    }
  };

  const handleCustomCategoryChange = (value: string) => {
    setCustomCategory(value);
    setCategory(value);
  };

  const selectedCategoryInfo = useMemo(() => {
    const normalize = (value: string) => value.toLocaleLowerCase('es');
    const selected = categoryOptions.find((option) => normalize(option.value) === normalize(category));
    if (selected) return selected;
    const trimmed = category.trim();
    if (!trimmed) return null;
    return {
      value: trimmed,
      label: trimmed,
      description: 'Categoría personalizada para este ticket.',
      accent: 'from-slate-500 via-slate-600 to-slate-700',
      icon: Sparkles,
    } as CategoryOption;
  }, [categoryOptions, category]);

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
      setCustomCategory('');
      dialogRef.current?.close();
    } finally {
      setSubmitting(false);
    }
  };

  // Control del <dialog> nativo y propagación del cierre
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const handleClose = () => onClose();
    dlg.addEventListener('close', handleClose);
    if (open) {
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
    return () => {
      dlg.removeEventListener('close', handleClose);
    };
  }, [open, onClose]);

  const allAreas = ['IT', 'Transporte', 'Obras', 'Aseo', 'RRHH', 'Finanza', 'P_Riesgo'] as const;

  return (
    <dialog ref={dialogRef} aria-labelledby="create-ticket-title" className="relative w-full max-w-5xl max-h-[calc(100vh-3rem)] overflow-y-auto rounded-3xl border border-slate-200/60 bg-white p-0 shadow-2xl shadow-slate-900/30 backdrop:backdrop-blur-sm dark:border-white/10 dark:bg-slate-950">
        <div className="relative grid overflow-hidden md:h-[80vh] md:grid-cols-[0.95fr,1.05fr]">
          <aside className="relative hidden h-full flex-col justify-between overflow-hidden bg-gradient-to-b from-indigo-600 via-sky-600 to-cyan-500 p-8 text-white md:flex md:overflow-y-auto">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_70%)]" />
            <div className="relative space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em]">Mesa de ayuda</span>
              <h2 className="text-2xl font-semibold leading-tight">Nuevo ticket con enfoque guiado</h2>
              <p className="text-sm text-white/80">Centraliza solicitudes internas con un formulario diseñado para capturar contexto, urgencia y áreas involucradas en un mismo paso.</p>
            </div>
            <div className="relative space-y-3 text-sm text-white/85">
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <Sparkles className="h-5 w-5" />
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/70">Paso rápido</p>
                  <p className="font-medium">Selecciona la categoría para personalizar campos y notificaciones.</p>
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.28em] text-white/70">Sugerencia</p>
                <p>Asigna tags para agilizar la priorización y la búsqueda en paneles futuros.</p>
              </div>
              {selectedCategoryInfo ? (
                <div className="space-y-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                      <selectedCategoryInfo.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/75">Categoría seleccionada</p>
                      <p className="text-base font-semibold">{selectedCategoryInfo.label}</p>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-white/70">{selectedCategoryInfo.description}</p>
                  {recipientArea.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/60">Áreas notificadas</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {recipientArea.map((area) => (
                          <span key={area} className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-white">
                            <Check className="h-3.5 w-3.5" />
                            {AREA_LABELS[area] ?? area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </aside>

          <div className="relative flex h-full flex-col bg-white px-6 py-6 dark:bg-slate-950 md:min-h-0 md:px-8 md:py-8">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200">Crear ticket</span>
                <h3 id="create-ticket-title" className="text-2xl font-semibold text-slate-900 dark:text-white">Describe la solicitud y notifícanos al instante</h3>
                <p className="text-sm text-slate-500 dark:text-slate-300">Completa los campos clave para coordinar la respuesta del equipo correspondiente.</p>
              </div>
              <button type="button" onClick={() => dialogRef.current?.close()} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10">
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar</span>
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-6 flex flex-1 flex-col gap-8 overflow-y-auto pr-1 md:min-h-0">
              <section className="space-y-4">
                <header className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shadow dark:bg-white dark:text-slate-900">1</span>
                  <div>
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white">Información básica</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Incorpora un título claro y contexto para entender el alcance.</p>
                  </div>
                </header>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor={titleId}>Título</label>
                    <input
                      id={titleId}
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      required
                      minLength={3}
                      placeholder="Ej. Falta acceso a sistema de inventario"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner shadow-slate-200/60 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor={descriptionId}>Descripción</label>
                    <textarea
                      id={descriptionId}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      rows={4}
                      placeholder="Detalla síntomas, usuarios afectados o acciones realizadas previamente."
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner shadow-slate-200/60 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <header className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shadow dark:bg-white dark:text-slate-900">2</span>
                  <div>
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white">Categoría y prioridad</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Selecciona el tipo de requerimiento y la urgencia para notificar correctamente.</p>
                  </div>
                </header>

                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {categoryOptions.map((option) => {
                      const Icon = option.icon;
                      const active = isCategorySelected(option.value);
                      return (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => handleSelectCategory(option.value)}
                          className={`group relative overflow-hidden rounded-2xl border px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 ${
                            active
                              ? 'border-transparent bg-gradient-to-br text-white shadow-lg shadow-indigo-200/50'
                              : 'border-slate-200/80 bg-white hover:border-indigo-400/80 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900'
                          } ${active ? option.accent : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              active
                                ? 'bg-white/15 text-white'
                                : 'bg-slate-100 text-indigo-500 dark:bg-slate-800 dark:text-indigo-300'
                            }`}>
                              <Icon className="h-5 w-5" />
                            </span>
                            <div className="space-y-1">
                              <p className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>{option.label}</p>
                              <p className={`text-xs leading-relaxed ${active ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>{option.description}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1.2fr,0.8fr]">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor={categoryId}>Otra categoría</label>
                      <input
                        id={categoryId}
                        value={customCategory}
                        onChange={(event) => handleCustomCategoryChange(event.target.value)}
                        placeholder="Personaliza si no aparece en la lista"
                        className="w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor={priorityId}>Prioridad</label>
                      <select
                        id={priorityId}
                        value={priority}
                        onChange={(event) => setPriority(event.target.value as TicketPriority)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner shadow-slate-200/60 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                      >
                        {Object.values(TicketPriority).map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <header className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shadow dark:bg-white dark:text-slate-900">3</span>
                  <div>
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white">Destinatarios y tags</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Define a quién notificar y agrega etiquetas para clasificar.</p>
                  </div>
                </header>

                <fieldset aria-labelledby={areasFieldsetId} className="space-y-3">
                  <legend id={areasFieldsetId} className="text-sm font-medium text-slate-700 dark:text-slate-200">Áreas destinatarias</legend>
                  <div className="flex flex-wrap gap-2">
                    {allAreas.map((area) => {
                      const checkboxId = `${areasFieldsetId}-${area}`;
                      const selected = recipientArea.includes(area);
                      return (
                        <label
                          key={area}
                          htmlFor={checkboxId}
                          className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                            selected
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-sm dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-200'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                          }`}
                          aria-label={AREA_LABELS[area] ?? area}
                        >
                          <input
                            id={checkboxId}
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleArea(area)}
                            className="sr-only"
                          />
                          <span className="inline-flex items-center gap-2">
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
                                selected
                                  ? 'border-white/0 bg-indigo-500 text-white shadow-sm dark:bg-indigo-400'
                                  : 'border-slate-300 bg-white text-transparent dark:border-slate-600 dark:bg-slate-900'
                              }`}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </span>
                            <span>{AREA_LABELS[area] ?? area}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor={tagsId}>Tags (separados por coma)</label>
                  <input
                    id={tagsId}
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                    placeholder="Ej. acceso, inventarios, soporte"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner shadow-slate-200/60 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                  />
                </div>
              </section>

              <div className="flex flex-col gap-3 border-t border-slate-200/70 pt-6 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>{/* helper text could be localized later */}Los campos marcados determinan automáticamente el flujo de notificaciones.</span>
                  <span>{recipientArea.length > 0 ? `${recipientArea.length} área(s) recibirán aviso` : t('tickets.noMatches')}</span>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => dialogRef.current?.close()}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={!validate() || submitting}
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200/60 transition hover:-translate-y-0.5 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                  >
                    {submitting ? t('common.creating') : t('tickets.newTicket')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
    </dialog>
  );
}
