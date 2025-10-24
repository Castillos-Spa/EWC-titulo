import React, { useState } from 'react';
import type { Incident, IncidentType, IncidentSeverity } from '../../../types/Incident';
import { useAuth } from '../../../contexts/AuthContext';
import { AlertTriangle, MapPin, Tag, AlignLeft, Compass, X, Sparkles } from 'lucide-react';

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
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Cerrar" />
      <dialog
        open
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-sky-50 via-white to-emerald-50 shadow-2xl shadow-slate-200/40 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-emerald-900/10"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/90 to-rose-500/90 text-white shadow-lg">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Reportar incidente</h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 p-6 md:grid-cols-5">
          <section className="md:col-span-3 space-y-5">
            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-blue-200/70">
              <span>Área</span>
              <div className="relative">
                <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  id="incident-area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-white/80 px-9 py-2.5 text-slate-800 shadow-inner shadow-slate-200/60 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-slate-100"
                >
                  {userAreas.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-blue-200/70">
                <span>Tipo</span>
                <div className="relative">
                  <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    id="incident-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as IncidentType)}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-white/80 px-9 py-2.5 text-slate-800 shadow-inner shadow-slate-200/60 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-slate-100"
                  >
                    {Object.entries(TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-blue-200/70">
                <span>Severidad</span>
                <div className="relative">
                  <AlertTriangle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    id="incident-severity"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-white/80 px-9 py-2.5 text-slate-800 shadow-inner shadow-slate-200/60 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-slate-100"
                  >
                    {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </label>
            </div>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-blue-200/70">
              <span>Título</span>
              <div className="relative">
                <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="incident-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Breve resumen"
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-9 py-2.5 text-slate-800 shadow-inner shadow-slate-200/60 transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-blue-200/70">
              <span>Descripción</span>
              <div className="relative">
                <AlignLeft className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <textarea
                  id="incident-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe el incidente..."
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-9 py-3 text-slate-800 shadow-inner shadow-slate-200/60 transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-blue-200/70">
              <span>Dirección (opcional)</span>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="incident-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Av. Principal 123"
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-9 py-2.5 text-slate-800 shadow-inner shadow-slate-200/60 transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-blue-200/70">
                <span>Latitud</span>
                <div className="relative">
                  <Compass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="incident-lat"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))}
                    type="number"
                    step="any"
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-9 py-2.5 text-slate-800 shadow-inner shadow-slate-200/60 transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-blue-200/70">
                <span>Longitud</span>
                <div className="relative">
                  <Compass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="incident-lng"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                    type="number"
                    step="any"
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-9 py-2.5 text-slate-800 shadow-inner shadow-slate-200/60 transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </label>
            </div>
          </section>

          <aside className="md:col-span-2 space-y-4">
            <div className="rounded-3xl border border-sky-200/70 bg-sky-50/80 px-4 py-4 text-sky-800 shadow-inner shadow-sky-200/40 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.24em]">Buenas prácticas</h4>
              <ul className="space-y-1 text-sm">
                <li>• Incluye un título breve y claro</li>
                <li>• Describe lo ocurrido con detalles relevantes</li>
                <li>• Agrega ubicación para responder más rápido</li>
                <li>• Marca correctamente la severidad</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300 hover:text-rose-600 dark:border-white/10 dark:bg-white/10 dark:text-blue-100">
                Cancelar
              </button>
              <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5">
                Crear incidente
              </button>
            </div>
          </aside>
        </form>
      </dialog>
    </div>
  );
};

export default CreateIncidentModal;