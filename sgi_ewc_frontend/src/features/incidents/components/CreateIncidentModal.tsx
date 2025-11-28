import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Incident, IncidentType, IncidentSeverity } from '../../../types/Incident';
import { useAuth } from '../../../contexts/AuthContext';
import { AlertTriangle, MapPin, Tag, AlignLeft, Compass, X, Sparkles, Paperclip, Trash2, ImageOff } from 'lucide-react';

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

const getAttachmentKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

const CreateIncidentModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onCreate: (
    data: Pick<Incident, 'area' | 'type' | 'severity' | 'title' | 'description' | 'location'>,
    attachments: File[],
  ) => Promise<void>;
}> = ({ open, onClose, onCreate }) => {
  const { user } = useAuth();
  const userAreas = user?.areas && user.areas.length ? user.areas : ['Transporte'];
  const defaultArea = userAreas[0] ?? 'Transporte';
  const [area, setArea] = useState(defaultArea);
  const [type, setType] = useState<IncidentType>('other');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const attachmentPreviews = useMemo<Map<string, string>>(() => {
    return attachments.reduce<Map<string, string>>((acc, file) => {
      acc.set(getAttachmentKey(file), URL.createObjectURL(file));
      return acc;
    }, new Map());
  }, [attachments]);

  useEffect(() => {
    return () => {
      attachmentPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachmentPreviews]);

  useEffect(() => {
    setArea(defaultArea);
  }, [defaultArea]);

  useEffect(() => {
    if (!open) {
      if (attachments.length) {
        setAttachments([]);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setArea(defaultArea);
      setType('other');
      setSeverity('medium');
      setTitle('');
      setDescription('');
      setAddress('');
      setLatitude('');
      setLongitude('');
    }
  }, [open, attachments.length, defaultArea]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const lat = latitude === '' ? undefined : latitude;
    const lng = longitude === '' ? undefined : longitude;
    const locationPayload: { latitude?: number; longitude?: number; address?: string } = {};
    if (typeof lat === 'number') {
      locationPayload.latitude = lat;
    }
    if (typeof lng === 'number') {
      locationPayload.longitude = lng;
    }
    const trimmedAddress = address.trim();
    if (trimmedAddress.length) {
      locationPayload.address = trimmedAddress;
    }
    try {
      setSubmitting(true);
      await onCreate({
        area,
        type,
        severity,
        title,
        description,
        location: Object.keys(locationPayload).length ? locationPayload : {},
      }, attachments);
      onClose();
      setType('other');
      setSeverity('medium');
      setTitle('');
      setDescription('');
      setAddress('');
      setLatitude('');
      setLongitude('');
      setArea(defaultArea);
      setAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error al crear incidente', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachmentsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.currentTarget;
    if (!files) return;
    const incoming = Array.from(files);
    setAttachments((prev) => {
      const next = [...prev];
      incoming.forEach((file) => {
        const exists = next.some((existing) => existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified);
        if (!exists) next.push(file);
      });
      return next;
    });
    event.currentTarget.value = '';
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Cerrar" />
      <dialog
        open
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Reportar incidente</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/70" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium text-slate-700 dark:text-slate-200">Área</span>
              <div className="relative">
                <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  id="incident-area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-9 py-2 text-sm text-slate-800 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {userAreas.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </label>

            <label className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium text-slate-700 dark:text-slate-200">Tipo</span>
              <div className="relative">
                <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  id="incident-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as IncidentType)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-9 py-2 text-sm text-slate-800 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </label>

            <label className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium text-slate-700 dark:text-slate-200">Severidad</span>
              <div className="relative">
                <AlertTriangle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  id="incident-severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-9 py-2 text-sm text-slate-800 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </label>
          </div>

          <label className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-700 dark:text-slate-200">Título</span>
            <div className="relative">
              <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="incident-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Resumen breve"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-9 py-2 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
          </label>

          <label className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-700 dark:text-slate-200">Descripción</span>
            <div className="relative">
              <AlignLeft className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <textarea
                id="incident-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                placeholder="Describe lo ocurrido..."
                className="w-full rounded-xl border border-slate-200 bg-white px-9 py-3 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium text-slate-700 dark:text-slate-200">Dirección (opcional)</span>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="incident-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Av. Principal 123"
                  className="w-full rounded-xl border border-slate-200 bg-white px-9 py-2 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <span className="font-medium text-slate-700 dark:text-slate-200">Latitud</span>
                <div className="relative">
                  <Compass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="incident-lat"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))}
                    type="number"
                    step="any"
                    className="w-full rounded-xl border border-slate-200 bg-white px-9 py-2 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </label>

              <label className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <span className="font-medium text-slate-700 dark:text-slate-200">Longitud</span>
                <div className="relative">
                  <Compass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="incident-lng"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                    type="number"
                    step="any"
                    className="w-full rounded-xl border border-slate-200 bg-white px-9 py-2 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </label>
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Evidencia fotográfica (opcional)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleAttachmentsChange}
                className="sr-only"
                id="incident-attachments"
              />
              <label
                htmlFor="incident-attachments"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-sky-400 hover:text-sky-600 dark:border-slate-600 dark:text-slate-200 dark:hover:border-sky-500"
              >
                <Paperclip className="h-4 w-4" /> Adjuntar archivos
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {attachments.map((file, index) => {
                  const key = getAttachmentKey(file);
                  const preview = attachmentPreviews.get(key);
                  return (
                    <figure
                      key={key}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
                    >
                      {preview ? (
                        <img
                          src={preview}
                          alt={file.name}
                          className="h-36 w-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        <div className="flex h-36 w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-400">
                          <ImageOff className="h-6 w-6" />
                        </div>
                      )}
                      <figcaption className="flex items-center justify-between gap-2 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200" title={file.name}>{file.name}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(index)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:border-rose-400 hover:text-rose-500 dark:border-slate-600 dark:text-slate-300 dark:hover:border-rose-500/80"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Quitar
                        </button>
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            )}
          </section>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <span className="font-medium text-slate-700 dark:text-slate-200">Tip rápido</span>
            <ul className="mt-2 space-y-1 text-xs leading-relaxed">
              <li>• Usa un título breve y directo para identificar el incidente.</li>
              <li>• Describe el impacto y la acción esperada.</li>
              <li>• Agrega ubicación o coordenadas si necesitas asistencia en terreno.</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
            <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-700 dark:border-slate-600 dark:text-slate-200">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Creando...' : 'Crear incidente'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
};

export default CreateIncidentModal;