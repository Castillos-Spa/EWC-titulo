import React, { useMemo } from 'react';
import { useIntlFormat } from '../../../app/intl/format';
import { CheckCircle2, Timer, AlertTriangle, Sparkles } from 'lucide-react';
import { useCleaning } from '../hooks/useCleaning';

type StatDescriptor = {
  id: string;
  label: string;
  value: string;
  helper: string;
  accent: string;
  icon: React.ReactNode;
};

const CleaningKpis: React.FC = () => {
  const { items } = useCleaning();
  const { locale } = useIntlFormat();

  const stats = useMemo<StatDescriptor[]>(() => {
    const total = items.length;
    const completed = items.filter(report => report.status === 'COMPLETED').length;
    const partial = items.filter(report => report.status === 'PARTIAL').length;
    const hours = items.reduce((sum, report) => sum + (report.timeSpent || 0), 0);
    const issues = items.reduce((sum, report) => sum + (report.issues?.length || 0), 0);

    return [
      {
        id: 'cleaning-total',
        label: 'Reportes activos',
        value: String(total),
        helper: `${completed} completados`,
        accent: 'from-sky-500/25 via-indigo-500/20 to-sky-400/25',
        icon: <CheckCircle2 className="h-6 w-6" />,
      },
      {
        id: 'cleaning-partial',
        label: 'Seguimiento',
        value: String(partial),
        helper: partial > 0 ? 'Requiere segundo turno' : 'Sin pendientes parciales',
        accent: 'from-amber-500/25 to-orange-500/25',
        icon: <Sparkles className="h-6 w-6" />,
      },
      {
        id: 'cleaning-hours',
        label: 'Horas invertidas',
        value: `${new Intl.NumberFormat(locale).format(hours)}h`,
        helper: hours > 0 ? 'Tiempo acumulado hoy' : 'Aún sin registros',
        accent: 'from-emerald-500/25 to-teal-500/25',
        icon: <Timer className="h-6 w-6" />,
      },
      {
        id: 'cleaning-issues',
        label: 'Incidencias',
        value: String(issues),
        helper: issues > 0 ? 'Atiende los hallazgos' : 'Todo en orden',
        accent: 'from-rose-500/25 to-pink-500/25',
        icon: <AlertTriangle className="h-6 w-6" />,
      },
    ];
  }, [items, locale]);

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

export default CleaningKpis;
