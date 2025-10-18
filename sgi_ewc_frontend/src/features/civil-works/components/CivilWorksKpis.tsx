import React, { useMemo } from 'react';
import { Building2, TrendingUp, Loader2, AlertTriangle } from 'lucide-react';
import { useCivilWorks } from '../hooks/useCivilWorks';

export const CivilWorksKpis: React.FC = () => {
  const { items } = useCivilWorks();
  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter(report => report.status === 'COMPLETED').length;
    const inProgress = items.filter(report => report.status === 'IN_PROGRESS').length;
    const onHold = items.filter(report => report.status === 'ON_HOLD').length;
    const avgProgress = total > 0
      ? Math.round(items.reduce((acc, report) => acc + (report.progress ?? 0), 0) / total)
      : 0;
    const delayed = items.filter(report => {
      const est = report.estimatedEndDate ? new Date(report.estimatedEndDate).getTime() : Number.NaN;
      return Number.isFinite(est) && est < Date.now() && report.status !== 'COMPLETED';
    }).length;
    const totalIssues = items.reduce((acc, report) => acc + (Array.isArray(report.issues) ? report.issues.length : 0), 0);

    return [
      {
        id: 'civil-total',
        label: 'Portafolio activo',
        value: String(total),
        helper: `${completed} completados`,
        accent: 'from-sky-500/25 via-indigo-500/20 to-sky-400/25',
        icon: <Building2 className="h-6 w-6" />,
      },
      {
        id: 'civil-progress',
        label: 'Avance promedio',
        value: `${avgProgress}%`,
        helper: 'Seguimiento consolidado',
        accent: 'from-emerald-500/25 to-teal-500/25',
        icon: <TrendingUp className="h-6 w-6" />,
      },
      {
        id: 'civil-running',
        label: 'En ejecución',
        value: String(inProgress),
        helper: `${onHold} en pausa`,
        accent: 'from-indigo-500/20 to-blue-500/25',
        icon: <Loader2 className="h-6 w-6" />,
      },
      {
        id: 'civil-risk',
        label: 'Proyectos en riesgo',
        value: String(delayed),
        helper: `${totalIssues} incidencias registradas`,
        accent: 'from-rose-500/20 to-amber-500/25',
        icon: <AlertTriangle className="h-6 w-6" />,
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
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{stat.label}</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-slate-700 shadow-sm backdrop-blur dark:bg-white/10 dark:text-blue-100">
                {stat.icon}
              </span>
            </div>
            <div className="text-3xl font-semibold tracking-tight">{stat.value}</div>
            <p className="text-sm text-slate-500 dark:text-blue-200/80">{stat.helper}</p>
          </div>
        </article>
      ))}
    </section>
  );
};

export default CivilWorksKpis;
