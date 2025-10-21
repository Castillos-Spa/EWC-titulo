import React from 'react';
import { Plus, Truck } from 'lucide-react';
import { FleetProvider, useFleetContext } from '../context/FleetContext';
import FleetInsights from '../components/FleetInsights';
import FleetDirectory from '../components/FleetDirectory';
import FleetVehicleModal from '../components/FleetVehicleModal';

const FleetPageInner: React.FC = () => {
  const { openCreate } = useFleetContext();

  return (
    <div className="space-y-10 text-slate-800 dark:text-slate-100">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-sky-100 via-white to-indigo-100 px-8 py-6 shadow-xl shadow-slate-200/40 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="pointer-events-none absolute -left-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-sky-400/30 blur-3xl dark:bg-sky-500/20" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-indigo-300/40 blur-3xl dark:bg-indigo-500/20" />
        <div className="relative flex flex-wrap items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
              <Truck className="h-4 w-4" />
              <span>Flota</span>
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Registro de Flota</h1>
            <p className="text-sm text-slate-600 dark:text-blue-100/80">
              Coordina camiones cisterna y unidades de apoyo desde un panel coherente con el nuevo lenguaje visual. Mantén visibilidad sobre mantenimientos y disponibilidad operativa.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Nuevo vehículo
          </button>
        </div>
      </section>

      <FleetInsights />
      <FleetDirectory />
      <FleetVehicleModal />
    </div>
  );
};

const FleetPage: React.FC = () => (
  <FleetProvider>
    <FleetPageInner />
  </FleetProvider>
);

export default FleetPage;
