import React, { useMemo, useState } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { CivilWorksProvider } from '../context/CivilWorksContext';
import { useCivilWorks } from '../hooks/useCivilWorks';
import CivilWorksKpis from '../components/CivilWorksKpis';
import CivilWorkCard from '../components/CivilWorkCard';
import CivilWorkDetailModal from '../components/CivilWorkDetailModal';
import CreateCivilWorkModal from '../components/CreateCivilWorkModal';
import EditCivilWorkModal from '../components/EditCivilWorkModal';
import CivilWorksFilters from '../components/CivilWorksFilters';
import type { CivilWorkStatus } from '../../../types/CivilWork';

const CivilWorksInner: React.FC = () => {
  const { items, selectById, selected, clearSelection } = useCivilWorks();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | CivilWorkStatus>('ALL');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items;
    if (q) {
      list = list.filter((r) => {
        const project = (r.project ?? '').toLowerCase();
        const location = (r.location ?? '').toLowerCase();
        const staff: string[] = Array.isArray(r.responsibleStaffUsernames) ? r.responsibleStaffUsernames : [];
        return project.includes(q) || location.includes(q) || staff.some((s) => s.toLowerCase().includes(q));
      });
    }
    if (status !== 'ALL') list = list.filter((r) => r.status === status);
    const toTs = to ? new Date(to).getTime() : Number.NaN;
    const fromTs = from ? new Date(from).getTime() : Number.NaN;
    if (Number.isFinite(fromTs)) {
      list = list.filter((r) => {
        const start = r.startDate ? new Date(r.startDate).getTime() : undefined;
        return start === undefined ? true : start >= fromTs;
      });
    }
    if (Number.isFinite(toTs)) {
      list = list.filter((r) => {
        const start = r.startDate ? new Date(r.startDate).getTime() : undefined;
        return start === undefined ? true : start <= toTs;
      });
    }
    return list;
  }, [items, search, status, from, to]);

  const resetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setFrom('');
    setTo('');
  };

  return (
    <div className="space-y-10 text-slate-800 dark:text-slate-100">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-sky-100 via-white to-indigo-100 px-8 py-6 shadow-xl shadow-slate-200/40 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="pointer-events-none absolute -left-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-sky-400/30 blur-3xl dark:bg-sky-500/20" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-indigo-300/40 blur-3xl dark:bg-indigo-500/20" />
        <div className="relative flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
              <Building2 className="h-4 w-4" /> Obras civiles
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Portafolio constructivo renovado</h1>
            <p className="text-sm text-slate-600 dark:text-blue-100/80">
              Supervisa proyectos, cronogramas y riesgos desde el mismo entorno translúcido aplicado al resto del hub. Crea obras, monitorea avances y coordina equipos en minutos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" /> Nueva obra
          </button>
        </div>
      </section>

      <CivilWorksKpis />

      <CivilWorksFilters
        items={items}
        search={search}
        status={status}
        from={from}
        to={to}
        total={filtered.length}
        onSearch={setSearch}
        onStatusChange={value => setStatus(value)}
        onFromChange={setFrom}
        onToChange={setTo}
        onReset={resetFilters}
      />

      <div className="grid gap-6">
        {filtered.map((cw) => {
          const isRenderable = cw.id !== undefined && cw.project && cw.location && cw.startDate && cw.estimatedEndDate && cw.status && cw.workType && typeof cw.progress === 'number';
          if (!isRenderable) return null;
          const item = cw as unknown as Pick<import('../../../types/CivilWork').CivilWork, 'id' | 'project' | 'location' | 'startDate' | 'estimatedEndDate' | 'status' | 'workType' | 'progress'>;
          return (
            <CivilWorkCard key={item.id} item={item} onView={(id) => { void selectById(id); }} />
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 px-6 py-10 text-center shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_rgba(15,23,42,0)_70%)]" />
          <div className="relative space-y-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No encontramos obras con los filtros actuales</h3>
            <p className="text-sm text-slate-500 dark:text-blue-200/80">Ajusta la búsqueda o crea un nuevo proyecto para comenzar el seguimiento.</p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
            >
              Programar nueva obra
            </button>
          </div>
        </div>
      )}
      {showCreate && (
        <CreateCivilWorkModal onClose={() => setShowCreate(false)} />
      )}
      {selected && (
        <CivilWorkDetailModal
          report={selected}
          onClose={() => {
            clearSelection();
            setShowEdit(false);
          }}
          onEdit={() => setShowEdit(true)}
        />
      )}
      {selected && showEdit && (
        <EditCivilWorkModal
          report={selected}
          onClose={() => {
            setShowEdit(false);
            clearSelection();
          }}
        />
      )}
    </div>
  );
};

const CivilWorksPage: React.FC = () => (
  <CivilWorksProvider>
    <CivilWorksInner />
  </CivilWorksProvider>
);

export default CivilWorksPage;
