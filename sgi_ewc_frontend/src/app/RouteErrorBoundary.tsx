import React from 'react';
import { useRouteError, isRouteErrorResponse, Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Home, RefreshCcw } from 'lucide-react';

const parseDataDescription = (data: unknown, fallback: string): string => {
  if (typeof data === 'string' && data.trim()) return data;
  if (typeof data === 'object' && data && 'message' in (data as Record<string, unknown>)) {
    const msg = (data as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
};

const getErrorDetails = (raw: unknown): { status: number; title: string; description: string } => {
  const defaults = {
    status: 500,
    title: 'Ha ocurrido un error',
    description: 'Algo salió mal. Intenta nuevamente o vuelve al inicio.',
  };

  if (isRouteErrorResponse(raw)) {
    const base = { ...defaults, status: raw.status, title: raw.statusText || defaults.title };
    const presets: Record<number, { title: string; description: string }> = {
      404: { title: 'Página no encontrada', description: 'La ruta que intentas abrir no existe o fue movida.' },
      401: { title: 'No autorizado', description: 'No tienes permisos para ver este contenido.' },
      403: { title: 'Acceso denegado', description: 'No tienes permisos suficientes para continuar.' },
    };
    const preset = presets[raw.status];
    if (preset) return { status: raw.status, ...preset };
    return { ...base, description: parseDataDescription(raw.data, base.description) };
  }

  if (raw instanceof Error) {
    return {
      status: 500,
      title: raw.name || defaults.title,
      description: raw.message || defaults.description,
    };
  }

  return defaults;
};

const RouteErrorBoundary: React.FC = () => {
  const navigate = useNavigate();
  const error = useRouteError();
  const { status, title, description } = getErrorDetails(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-xl rounded-3xl border border-blue-100 bg-white p-8 text-slate-900 shadow-xl dark:border-white/10 dark:bg-white/10 dark:text-white dark:backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-slate-500 dark:text-blue-100/80">Error {status}</div>
            <h1 className="text-2xl font-semibold">{title}</h1>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600 dark:text-blue-100/80">{description}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 dark:focus:ring-white/40"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 dark:focus:ring-white/40"
          >
            <Home className="h-4 w-4" /> Ir al inicio
          </Link>
          <button
            type="button"
            onClick={() => globalThis.location?.reload()}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 px-4 py-2 text-sm font-medium text-white shadow-lg hover:from-sky-300 hover:via-indigo-300 hover:to-purple-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:shadow-indigo-900/40 dark:focus:ring-white/60"
          >
            <RefreshCcw className="h-4 w-4" /> Reintentar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteErrorBoundary;
