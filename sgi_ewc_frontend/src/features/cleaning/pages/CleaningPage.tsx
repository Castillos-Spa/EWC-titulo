import React, { useMemo, useState } from 'react';
import { Plus, Sparkles, Users } from 'lucide-react';
import { CleaningProvider } from '../context/CleaningContext';
import { useCleaning } from '../hooks/useCleaning';
import CleaningKpis from '../components/CleaningKpis';
import CleaningCard from '../components/CleaningCard';
import CleaningDetailModal from '../components/CleaningDetailModal';
import CreateCleaningModal from '../components/CreateCleaningModal';
import EditCleaningModal from '../components/EditCleaningModal';
import CleaningFilters from '../components/CleaningFilters';
import type { Aseo, CleaningStatus } from '../../../types/Aseo';

const CleaningInner: React.FC = () => {
  const { items, create, update } = useCleaning();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CleaningStatus | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState<Aseo | null>(null);
  const [edit, setEdit] = useState<Aseo | null>(null);

  const ordered = useMemo(() => {
    return [...items].sort((a, b) => {
      const dateA = Date.parse(a.date ?? '') || 0;
      const dateB = Date.parse(b.date ?? '') || 0;
      return dateB - dateA;
    });
  }, [items]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return ordered.filter(report => {
      const matchesSearch =
        query.length === 0 ||
        report.area.toLowerCase().includes(query) ||
        report.responsibleStaff.toLowerCase().includes(query) ||
        report.tasks.some(task => task.toLowerCase().includes(query));
      const matchesStatus = status === 'all' || report.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [ordered, search, status]);

  const totals = useMemo(() => {
    const completed = items.filter(report => report.status === 'COMPLETED').length;
    const pending = items.filter(report => report.status === 'PENDING').length;
    const partial = items.filter(report => report.status === 'PARTIAL').length;
    const totalHours = items.reduce((sum, report) => sum + (report.timeSpent || 0), 0);
    return { completed, pending, partial, totalHours } as const;
  }, [items]);

  const topPerformer = useMemo(() => {
    const counter = new Map<string, number>();
    for (const report of items) {
      const current = counter.get(report.responsibleStaff) ?? 0;
      counter.set(report.responsibleStaff, current + 1);
    }
    let best: { staff: string; count: number } | null = null;
    for (const [staff, count] of counter.entries()) {
      if (!best || count > best.count) {
        best = { staff, count };
      }
    }
    return best;
  }, [items]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('all');
  };

  return (
    <div className="space-y-10 text-slate-800 dark:text-slate-100">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-sky-100 via-white to-emerald-100 px-8 py-6 shadow-xl shadow-slate-200/40 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-emerald-900/10">
        <div className="pointer-events-none absolute -left-20 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/20" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-emerald-300/25 blur-3xl dark:bg-emerald-500/20" />
        <div className="relative flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
              <Sparkles className="h-4 w-4" />
              Brigada de aseo
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Coordinación integral de reportes de limpieza en tiempo real</h1>
            <p className="text-sm text-slate-600 dark:text-blue-100/80">
              Centraliza seguimientos por área, valida incidencias críticas y reconoce al personal destacado dentro del nuevo tablero colaborativo.
            </p>
            <div className="grid gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70 sm:grid-cols-2">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-2 text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
                <Sparkles className="h-4 w-4" /> {totals.completed} completado(s) · {totals.pending} pendiente(s)
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200/70 bg-white/70 px-4 py-2 text-emerald-600 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                <Users className="h-4 w-4" />
                {topPerformer ? `${topPerformer.staff} lidera con ${topPerformer.count} reporte(s)` : 'Aún sin personal destacado'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" /> Registrar nuevo reporte
          </button>
        </div>
      </section>

      <CleaningKpis />

      <CleaningFilters
        reports={items}
        search={search}
        status={status}
        total={filtered.length}
        onSearch={setSearch}
        onStatusChange={setStatus}
        onReset={handleResetFilters}
      />

      <div className="grid gap-6">
        {filtered.map(report => (
          <CleaningCard key={report.id} report={report} onView={setDetail} onEdit={setEdit} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 px-6 py-12 text-center shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/30">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_rgba(15,23,42,0)_70%)]" />
          <div className="relative space-y-3 text-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No hay reportes con los filtros aplicados</h3>
            <p className="text-slate-500 dark:text-blue-200/80">Ajusta la búsqueda o registra un nuevo reporte para mantener el historial actualizado.</p>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateCleaningModal onClose={() => setShowCreate(false)} onCreate={async (p) => { await create(p); }} />
      )}
      {detail && (
        <CleaningDetailModal report={detail} onClose={() => setDetail(null)} onEdit={(r) => { setDetail(null); setEdit(r); }} />
      )}
      {edit && (
        <EditCleaningModal report={edit} onClose={() => setEdit(null)} onUpdate={async (id, p) => { await update(id, p); }} />
      )}
    </div>
  );
};

const CleaningPage: React.FC = () => (
  <CleaningProvider>
    <CleaningInner />
  </CleaningProvider>
);

export default CleaningPage;