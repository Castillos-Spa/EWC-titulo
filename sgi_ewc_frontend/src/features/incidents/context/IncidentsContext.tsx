import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { Incident } from '../../../types/Incident';
import { fetchIncidents, createIncident, updateIncident, deleteIncident, uploadIncidentPhotos, getIncidentPhotos } from '../../../utils/incidentApi';

type Ctx = {
  items: Incident[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (data: Partial<Incident>, attachments?: File[]) => Promise<Incident>;
  update: (id: string, patch: Partial<Incident>) => Promise<Incident>;
  remove: (id: string) => Promise<void>;
  uploadPhotos: (id: string, files: File[]) => Promise<string[]>;
  loadPhotos: (id: string) => Promise<string[]>;
};

const IncidentsContext = createContext<Ctx | undefined>(undefined);

export const IncidentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchIncidents();
      setItems(data);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar los incidentes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (data: Partial<Incident>, attachments?: File[]) => {
    const created = await createIncident(data);
    const reporterName = typeof data.reportedBy === 'string' ? data.reportedBy : '';
    let next = reporterName ? { ...created, reportedBy: reporterName } : created;

    if (attachments && attachments.length) {
      const { photos } = await uploadIncidentPhotos(created.id, attachments);
      next = { ...next, photos };
    }

    setItems(prev => [next, ...prev]);
    return next;
  }, []);

  const update = useCallback(async (id: string, patch: Partial<Incident>) => {
    const updated = await updateIncident(id, patch);
    setItems(prev => prev.map(i => i.id === id ? updated : i));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteIncident(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const uploadPhotos = useCallback(async (id: string, files: File[]) => {
    if (!files.length) return [];
    const { photos } = await uploadIncidentPhotos(id, files);
    setItems(prev => prev.map(i => (i.id === id ? { ...i, photos } : i)));
    return photos;
  }, []);

  const loadPhotos = useCallback(async (id: string) => {
    const photos = await getIncidentPhotos(id);
    setItems(prev => prev.map(i => (i.id === id ? { ...i, photos } : i)));
    return photos;
  }, []);

  const value = useMemo<Ctx>(
    () => ({ items, loading, error, refresh, create, update, remove, uploadPhotos, loadPhotos }),
    [items, loading, error, refresh, create, update, remove, uploadPhotos, loadPhotos],
  );
  return <IncidentsContext.Provider value={value}>{children}</IncidentsContext.Provider>;
};

export default IncidentsContext;