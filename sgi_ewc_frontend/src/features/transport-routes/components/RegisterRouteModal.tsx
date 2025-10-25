import React, { useEffect } from 'react';
import RouteForm from './RouteForm';

interface RegisterRouteModalProps {
  open: boolean;
  onClose: () => void;
}

const RegisterRouteModal: React.FC<RegisterRouteModalProps> = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    globalThis.addEventListener('keydown', handler);
    return () => globalThis.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-10 backdrop-blur">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-6 text-slate-800 shadow-2xl shadow-slate-300/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400 dark:text-blue-200/60">Nuevo registro</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Nueva Ruta</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-blue-200/70">Completa los datos del trayecto para incorporarlo al prototipo.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-blue-100"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="mt-6">
          <RouteForm onSubmitSuccess={onClose} />
        </div>
      </div>
    </div>
  );
};

export default RegisterRouteModal;
