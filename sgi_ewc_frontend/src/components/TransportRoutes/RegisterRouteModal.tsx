import React, { useEffect } from 'react';
import RouteForm from './RouteForm';

interface RegisterRouteModalProps {
  open: boolean;
  onClose: () => void;
}

const RegisterRouteModal: React.FC<RegisterRouteModalProps> = ({ open, onClose }) => {
  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl p-6 mt-10 bg-white rounded-lg shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-700 animate-fade-in">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Nueva Ruta</h2>
          <button onClick={onClose} className="p-2 text-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Cerrar">
            <span className="text-lg">×</span>
          </button>
        </div>
        <RouteForm />
      </div>
    </div>
  );
};

export default RegisterRouteModal;