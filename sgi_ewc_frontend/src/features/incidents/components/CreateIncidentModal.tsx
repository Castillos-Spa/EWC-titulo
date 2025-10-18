import React, { useState } from 'react';
import type { Incident, IncidentType, IncidentSeverity } from '../../../types/Incident';
import { useAuth } from '../../../contexts/AuthContext';

const TYPE_LABELS: Record<IncidentType, string> = {
  vehicle_breakdown: 'Avería de Vehículo',
  accident: 'Accidente',
  traffic_delay: 'Retraso de Tráfico',
  weather: 'Clima Adverso',
  security: 'Seguridad',
  other: 'Otro',
};

const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
};

const CreateIncidentModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onCreate: (data: Pick<Incident, 'area' | 'type' | 'severity' | 'title' | 'description' | 'location'>) => void;
}> = ({ open, onClose, onCreate }) => {
  const { user } = useAuth();
  const userAreas = (user?.areas ?? ['Transporte']);
  const [area, setArea] = useState(userAreas[0]);
  const [type, setType] = useState<IncidentType>('other');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const lat = typeof latitude === 'number' ? latitude : Number(latitude);
    const lng = typeof longitude === 'number' ? longitude : Number(longitude);
    onCreate({
      area,
      type,
      severity,
      title,
      description,
      location: { latitude: lat, longitude: lng, address: address || undefined },
    });
    onClose();
    setType('other');
    setSeverity('medium');
    setTitle('');
    setDescription('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setArea(userAreas[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Cerrar" />
      <dialog open className="relative w-full max-w-2xl bg-white border border-transparent shadow-xl dark:bg-slate-900 rounded-xl dark:border-slate-700">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reportar Incidente</h3>
          <button onClick={onClose} className="px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="incident-area" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Área</label>
            <select id="incident-area" value={area} onChange={(e) => setArea(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-100">
              {userAreas.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="incident-type" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
              <select id="incident-type" value={type} onChange={(e) => setType(e.target.value as IncidentType)} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-100">
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="incident-severity" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Severidad</label>
              <select id="incident-severity" value={severity} onChange={(e) => setSeverity(e.target.value as IncidentSeverity)} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-100">
                {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="incident-title" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
            <input id="incident-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Breve resumen" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
          </div>
          <div>
            <label htmlFor="incident-description" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
            <textarea id="incident-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe el incidente..." className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
          </div>

          <div>
            <label htmlFor="incident-address" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Dirección (opcional)</label>
            <input id="incident-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Av. Principal 123" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="incident-lat" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Latitud</label>
              <input id="incident-lat" value={latitude} onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))} type="number" step="any" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
            </div>
            <div>
              <label htmlFor="incident-lng" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Longitud</label>
              <input id="incident-lng" value={longitude} onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))} type="number" step="any" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg dark:text-slate-100 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">Crear</button>
          </div>
        </form>
      </dialog>
    </div>
  );
};

export default CreateIncidentModal;