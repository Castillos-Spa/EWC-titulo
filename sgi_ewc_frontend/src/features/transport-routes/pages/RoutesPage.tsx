import React from 'react';
import { RouteProvider } from '@features/transport-routes/context/RouteContext';
import RouteKPIs from '@features/transport-routes/components/RouteKPIs';
import RegisterRouteModal from '@features/transport-routes/components/RegisterRouteModal';
import RouteList from '@features/transport-routes/components/RouteList';
import { Navigation2 } from 'lucide-react';

const RoutesPageInner: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="space-y-10 text-slate-800 dark:text-slate-100">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-sky-100 via-white to-indigo-100 px-8 py-6 shadow-xl shadow-slate-200/40 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="pointer-events-none absolute -left-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-sky-400/30 blur-3xl dark:bg-sky-500/20" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-indigo-300/40 blur-3xl dark:bg-indigo-500/20" />
        <div className="relative flex flex-wrap items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
              <Navigation2 className="h-4 w-4" />{' '}
              <span>Rutas</span>
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Planeación y Control de Rutas</h1>
            <p className="text-sm text-slate-600 dark:text-blue-100/80">
              Supervisa el desempeño de los trayectos logísticos, identifica cuellos de botella y mantén el flujo operativo alineado con la nueva experiencia visual del hub corporativo.
            </p>
          </div>
        </div>
      </section>

      <RouteKPIs />
      <RouteList onCreate={() => setOpen(true)} />

      <div className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-amber-50/80 px-6 py-5 text-amber-700 shadow-lg shadow-amber-200/40 backdrop-blur dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100">
        <div className="pointer-events-none absolute -right-16 -top-10 h-40 w-40 rounded-full bg-amber-200/50 blur-3xl dark:bg-amber-400/20" />
        <div className="relative text-xs leading-relaxed">
          <strong className="font-semibold uppercase tracking-[0.28em] text-amber-600 dark:text-amber-200">Aviso</strong>
          <p className="mt-2 max-w-3xl">
            Este módulo opera con datos en memoria para facilitar iteraciones de diseño. Si necesitas persistencia real, reemplaza el contexto local por llamadas a la API y actualizaciones en servidor.
          </p>
        </div>
      </div>

      <RegisterRouteModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

const RoutesPage: React.FC = () => (
  <RouteProvider>
    <RoutesPageInner />
  </RouteProvider>
);

export default RoutesPage;
