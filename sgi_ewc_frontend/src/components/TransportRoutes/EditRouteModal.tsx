import React, { useEffect } from 'react';
import RouteForm from './RouteForm';
import { TransportRoute } from './RouteContext';

interface EditRouteModalProps {
  route: TransportRoute | null;
  open: boolean;
  onClose: () => void;
}

const EditRouteModal: React.FC<EditRouteModalProps> = ({ route, open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !route) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl p-6 mt-10 bg-white rounded-lg shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Editar Ruta {route.code}</h2>
          <button onClick={onClose} className="p-2 text-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Cerrar">
            <span className="text-lg">×</span>
          </button>
        </div>
        <RouteForm mode="edit" initial={route} onSubmitSuccess={onClose} />
      </div>
    </div>
  );
};

export default EditRouteModal;