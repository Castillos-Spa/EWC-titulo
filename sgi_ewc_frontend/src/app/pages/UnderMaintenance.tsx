import React from 'react';
import { Wrench, ArrowLeft, Home } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface UnderMaintenanceProps {
  title?: string;
  description?: string;
  backHref?: string; // si se provee, usar Link; si no, navegar -1
}

const UnderMaintenance: React.FC<UnderMaintenanceProps> = ({
  title = 'Módulo en mantenimiento',
  description = 'Estamos trabajando para mejorar esta funcionalidad. Por favor, vuelve más tarde.',
  backHref,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-xl rounded-3xl border border-blue-100 bg-white p-8 text-slate-900 shadow-xl dark:border-white/10 dark:bg-white/10 dark:text-white dark:backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-blue-100/80">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {backHref ? (
            <Link
              to={backHref}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 dark:focus:ring-white/40"
            >
              <ArrowLeft className="h-4 w-4" /> Volver
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 dark:focus:ring-white/40"
            >
              <ArrowLeft className="h-4 w-4" /> Volver
            </button>
          )}
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 dark:focus:ring-white/40"
          >
            <Home className="h-4 w-4" /> Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnderMaintenance;
