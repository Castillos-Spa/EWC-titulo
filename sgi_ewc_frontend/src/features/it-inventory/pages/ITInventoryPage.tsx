import { NavLink, Outlet } from 'react-router-dom';
import { Monitor, LayoutDashboard, HardDrive, KeySquare, History, BookMarked } from 'lucide-react';

export default function ITInventoryPage() {
  const tabs = [
    { to: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { to: 'assets', label: 'Activos', Icon: HardDrive },
    { to: 'licenses', label: 'Licencias', Icon: KeySquare },
    { to: 'movements', label: 'Movimientos', Icon: History },
    { to: 'catalogs', label: 'Catálogos', Icon: BookMarked },
  ];

  return (
    <div className="space-y-8 text-slate-800 dark:text-slate-100">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-indigo-100 via-white to-sky-100 px-8 py-6 shadow-xl shadow-slate-200/40 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="pointer-events-none absolute -left-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-sky-400/30 blur-3xl dark:bg-sky-500/20" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-indigo-300/40 blur-3xl dark:bg-indigo-500/20" />
        <div className="relative flex flex-wrap items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
              <Monitor className="h-4 w-4" />
              <span>Inventario IT</span>
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Gestión avanzada de activos y licencias</h1>
            <p className="text-sm text-slate-600 dark:text-blue-100/80">Ciclo de vida completo, auditoría y catálogos maestros. Módulo mock sin backend.</p>
          </div>
        </div>
        <div className="relative mt-6 flex flex-wrap gap-2">
          {tabs.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm ${isActive ? 'border-sky-400 bg-white text-slate-800 shadow-sm dark:bg-white/10' : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-blue-100'}`}
              end
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </div>
      </section>

      <Outlet />
    </div>
  );
}
