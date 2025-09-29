import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Plus, Search, Globe2, Users2, AlertTriangle, Clock, Send, Calendar, Pin, PinOff, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { AppNotification, NotificationTarget, NotificationPriority } from '../../types/Notification';
import { PRIORITY_LABELS } from '../../types/Notification';
import { listNotifications, createNotification, updateNotification, deleteNotification, type CreateNotificationPayload } from '../../utils/notificationApi';

const targetLabel = (t: NotificationTarget) => t.scope === 'global' ? 'Global' : `Áreas: ${t.areas.join(', ')}`;

const priorityBadge = (p: NotificationPriority) => {
  switch (p) {
    case 'high': return 'bg-red-50 text-red-700';
    case 'normal': return 'bg-blue-50 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const NotificationsCenter: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<'all' | 'global' | 'areas'>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AppNotification | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await listNotifications();
        setItems(data);
        setError(null);
      } catch (e) {
        console.error(e);
        setError('No se pudieron cargar las notificaciones');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const areasUniverse = useMemo(() => {
    const fromUser = user?.areas ?? [];
    const fromData = items.flatMap(n => n.target.scope === 'areas' ? n.target.areas : []);
    return Array.from(new Set([...fromUser, ...fromData]));
  }, [items, user?.areas]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(n => {
      const matchesText = !q || n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
      const matchesScope = scope === 'all' || n.target.scope === scope;
      const matchesArea = areaFilter === 'all' || (n.target.scope === 'areas' && n.target.areas.includes(areaFilter));
      return matchesText && matchesScope && matchesArea;
    });
  }, [items, search, scope, areaFilter]);

  const stats = useMemo(() => {
    const total = items.length;
    const globalCount = items.filter(i => i.target.scope === 'global').length;
    const areasCount = total - globalCount;
    const scheduled = items.filter(i => i.status === 'scheduled').length;
    return { total, globalCount, areasCount, scheduled };
  }, [items]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  const form = new FormData(e.currentTarget);
  const title = (form.get('title') as string | null)?.toString().trim() || '';
  const message = (form.get('message') as string | null)?.toString().trim() || '';
  const priority = ((form.get('priority') as string | null)?.toString() || 'normal') as NotificationPriority;
  const scopeSel = (form.get('scope') as string | null)?.toString() || 'global';
  const scheduledAtRaw = (form.get('scheduledAt') as string | null)?.toString() || '';
  const scheduledAt = scheduledAtRaw || undefined;
    let target: NotificationTarget;
    if (scopeSel === 'areas') {
  const areasRaw = (form.get('areas') as string | null)?.toString() || '';
  const areas = areasRaw.split(',').map(s => s.trim()).filter(Boolean);
      if (areas.length === 0) {
        alert('Especifica al menos un área');
        return;
      }
      target = { scope: 'areas', areas };
    } else {
      target = { scope: 'global' };
    }
    if (!title || !message) {
      alert('Título y Mensaje son obligatorios');
      return;
    }
    const payload: CreateNotificationPayload = {
      title,
      message,
      priority,
      target,
      scheduledAt,
      createdBy: user?.username || 'usuario',
    };
    const created = await createNotification(payload);
    setItems(prev => [created, ...prev]);
    setOpen(false);
    e.currentTarget.reset();
  };

  const togglePin = async (n: AppNotification) => {
    const updated = await updateNotification(n.id, { pinned: !n.pinned });
    if (updated) setItems(prev => prev.map(x => x.id === n.id ? updated : x));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar notificación?')) return;
    await deleteNotification(id);
    setItems(prev => prev.filter(n => n.id !== id));
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    const title = (form.get('title') as string | null)?.toString().trim() || '';
    const message = (form.get('message') as string | null)?.toString().trim() || '';
    const priority = ((form.get('priority') as string | null)?.toString() || editing.priority) as NotificationPriority;
    const scopeSel = (form.get('scope') as string | null)?.toString() || (editing.target.scope);
    const scheduledAtRaw = (form.get('scheduledAt') as string | null)?.toString() || '';
    const scheduledAt = scheduledAtRaw || undefined;
    let target: NotificationTarget = editing.target;
    if (scopeSel === 'areas') {
      const areasRaw = (form.get('areas') as string | null)?.toString() || '';
      const areas = areasRaw.split(',').map(s => s.trim()).filter(Boolean);
      target = { scope: 'areas', areas };
    } else if (scopeSel === 'global') {
      target = { scope: 'global' };
    }
    if (!title || !message) { alert('Título y Mensaje son obligatorios'); return; }
    const updated = await updateNotification(editing.id, { title, message, priority, target, scheduledAt });
    if (updated) {
      setItems(prev => prev.map(n => n.id === updated.id ? updated : n));
      setEditing(null);
    }
  };

  if (loading) return <div className="text-center text-gray-600">Cargando notificaciones…</div>;

  return (
    <div className="space-y-6">
      {error && <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Centro de Notificaciones</h2>
          <p className="text-gray-600">Crea notificaciones globales o dirigidas a áreas específicas</p>
        </div>
        <button onClick={() => setOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Notificación
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Globales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.globalCount}</p>
            </div>
            <Globe2 className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Por Áreas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.areasCount}</p>
            </div>
            <Users2 className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Programadas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.scheduled}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título o mensaje…" className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={scope} onChange={(e) => setScope(e.target.value as 'all'|'global'|'areas')} className="px-3 py-2 border rounded-lg">
          <option value="all">Todas</option>
          <option value="global">Globales</option>
          <option value="areas">Por áreas</option>
        </select>
        <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="all">Todas las áreas</option>
          {areasUniverse.map(a => (<option key={a} value={a}>{a}</option>))}
        </select>
        <div className="text-sm text-gray-600 flex items-center">{filtered.length} notificaciones</div>
      </div>

      {/* Listado */}
      <div className="grid gap-4">
        {filtered.map(n => (
          <div key={n.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${priorityBadge(n.priority)}`}>{PRIORITY_LABELS[n.priority]}</span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">{targetLabel(n.target)}</span>
                  {n.status === 'scheduled' && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> Programada</span>
                  )}
                  {n.pinned && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 inline-flex items-center gap-1"><Pin className="w-3 h-3" /> Fijada</span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{n.title}</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{n.message}</p>
              </div>
              <div className="flex flex-col items-end gap-3 min-w-[220px]">
                <div className="text-sm text-gray-600 text-right">
                  <div>Creada por <span className="font-medium">{n.createdBy}</span></div>
                  <div>{new Date(n.createdAt).toLocaleString('es-ES')}</div>
                  {n.scheduledAt && <div>Envío: {new Date(n.scheduledAt).toLocaleString('es-ES')}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => togglePin(n)} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 inline-flex items-center gap-2" title={n.pinned ? 'Quitar fijación' : 'Fijar'}>
                    {n.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setEditing(n)} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-2" title="Editar">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(n.id)} className="px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 inline-flex items-center gap-2" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          Sin notificaciones según los filtros
        </div>
      )}

      {/* Modal Crear */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Nueva Notificación</h3>
              <button onClick={() => setOpen(false)} className="px-2 py-1">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nc-scope" className="block text-sm font-medium mb-1">Ámbito</label>
                  <select id="nc-scope" name="scope" className="w-full px-3 py-2 border rounded-lg">
                    <option value="global">Global</option>
                    <option value="areas">Por áreas</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="nc-priority" className="block text-sm font-medium mb-1">Prioridad</label>
                  <select id="nc-priority" name="priority" className="w-full px-3 py-2 border rounded-lg" defaultValue="normal">
                    <option value="low">Baja</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="nc-areas" className="block text-sm font-medium mb-1">Áreas (separadas por coma)</label>
                <input id="nc-areas" name="areas" placeholder="Transporte, Taller" className="w-full px-3 py-2 border rounded-lg" />
                <p className="text-xs text-gray-500 mt-1">Se utiliza solo si el ámbito es “Por áreas”.</p>
              </div>
              <div>
                <label htmlFor="nc-title" className="block text-sm font-medium mb-1">Título</label>
                <input id="nc-title" name="title" className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label htmlFor="nc-message" className="block text-sm font-medium mb-1">Mensaje</label>
                <textarea id="nc-message" name="message" rows={4} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label htmlFor="nc-scheduledAt" className="block text-sm font-medium mb-1">Programar envío (opcional)</label>
                <input id="nc-scheduledAt" name="scheduledAt" type="datetime-local" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg inline-flex items-center gap-2">
                  <Send className="w-4 h-4" /> Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Editar Notificación</h3>
              <button onClick={() => setEditing(null)} className="px-2 py-1">✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ne-scope" className="block text-sm font-medium mb-1">Ámbito</label>
                  <select id="ne-scope" name="scope" className="w-full px-3 py-2 border rounded-lg" defaultValue={editing.target.scope}>
                    <option value="global">Global</option>
                    <option value="areas">Por áreas</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ne-priority" className="block text-sm font-medium mb-1">Prioridad</label>
                  <select id="ne-priority" name="priority" className="w-full px-3 py-2 border rounded-lg" defaultValue={editing.priority}>
                    <option value="low">Baja</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="ne-areas" className="block text-sm font-medium mb-1">Áreas (separadas por coma)</label>
                <input id="ne-areas" name="areas" placeholder="Transporte, Taller" className="w-full px-3 py-2 border rounded-lg" defaultValue={editing.target.scope === 'areas' ? editing.target.areas.join(', ') : ''} />
                <p className="text-xs text-gray-500 mt-1">Se utiliza solo si el ámbito es “Por áreas”.</p>
              </div>
              <div>
                <label htmlFor="ne-title" className="block text-sm font-medium mb-1">Título</label>
                <input id="ne-title" name="title" className="w-full px-3 py-2 border rounded-lg" defaultValue={editing.title} required />
              </div>
              <div>
                <label htmlFor="ne-message" className="block text-sm font-medium mb-1">Mensaje</label>
                <textarea id="ne-message" name="message" rows={4} className="w-full px-3 py-2 border rounded-lg" defaultValue={editing.message} required />
              </div>
              <div>
                <label htmlFor="ne-scheduledAt" className="block text-sm font-medium mb-1">Programar envío (opcional)</label>
                <input id="ne-scheduledAt" name="scheduledAt" type="datetime-local" className="w-full px-3 py-2 border rounded-lg" defaultValue={editing.scheduledAt ? new Date(editing.scheduledAt).toISOString().slice(0,16) : ''} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg inline-flex items-center gap-2">
                  <Send className="w-4 h-4" /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsCenter;
