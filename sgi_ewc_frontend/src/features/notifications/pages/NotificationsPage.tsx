import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Plus, Search, Globe2, Users2, AlertTriangle, Clock, Send, Calendar, Pin, PinOff, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import type { AppNotification, NotificationTarget, NotificationPriority, CreateNotificationPayload } from '../../../types/Notification';
import { PRIORITY_LABELS } from '../../../types/Notification';
import { NotificationsProvider } from '../context/NotificationsContext';
import { useNotifications } from '../hooks/useNotifications';

const targetLabel = (t: NotificationTarget) => {
  switch (t.scope) {
    case 'global':
      return 'Global';
    case 'areas':
      return `Áreas: ${t.areas.join(', ')}`;
    case 'roles':
      return `Roles: ${t.roles.join(', ')}`;
  }
};

const priorityBadge = (p: NotificationPriority) => {
  switch (p) {
    case 'high': return 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300';
    case 'normal': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
};

const ALL_AREAS = ['IT', 'Transporte', 'Obras', 'Aseo', 'RRHH', 'Finanza', 'P_Riesgo'];

const normalizeTargetScope = (s: NotificationTarget['scope']): 'global' | 'areas' => (s === 'roles' ? 'areas' : s);

const NotificationsCenterInner: React.FC = () => {
  const { user } = useAuth();
  const { items, loading, error, create, update, remove } = useNotifications();
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<'all' | 'global' | 'areas'>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AppNotification | null>(null);
  const [createScope, setCreateScope] = useState<'global' | 'areas'>('global');
  const [editScope, setEditScope] = useState<'global' | 'areas'>(normalizeTargetScope(editing?.target.scope || 'global'));

  useEffect(() => { if (editing) setEditScope(normalizeTargetScope(editing.target.scope)); }, [editing]);

  const areasUniverse = useMemo(() => {
    const fromData = items.flatMap(n => n.target.scope === 'areas' ? n.target.areas : []);
    return Array.from(new Set([...ALL_AREAS, ...fromData]));
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(n => {
      const matchesText = !q || n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
      const matchesScope = scope === 'all' || n.target.scope === scope;
      const matchesArea = areaFilter === 'all' || (n.target.scope === 'areas' && n.target.areas.includes(areaFilter));
      return matchesText && matchesScope && matchesArea;
    });
  }, [items, search, scope, areaFilter]);

  // KPIs se calculan inline en render para evitar estado derivado innecesario

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formRef = e.currentTarget;
    const form = new FormData(formRef);
    const title = (form.get('title') as string | null)?.toString().trim() || '';
    const message = (form.get('message') as string | null)?.toString().trim() || '';
    const priority = ((form.get('priority') as string | null)?.toString() || 'normal') as NotificationPriority;
    const scopeSel = (form.get('scope') as string | null)?.toString() || 'global';
    const scheduledAtRaw = (form.get('scheduledAt') as string | null)?.toString() || '';
    const scheduledAt = scheduledAtRaw || undefined;
    let target: NotificationTarget;
    if (scopeSel === 'areas') {
      const areas = areasUniverse.filter(area => form.get(`area-${area}`));
      if (areas.length === 0) { alert('Especifica al menos un área'); return; }
      target = { scope: 'areas', areas };
    } else { target = { scope: 'global' }; }
    if (!title || !message) { alert('Título y Mensaje son obligatorios'); return; }
    const payload: CreateNotificationPayload = { title, message, priority, target, scheduledAt };
    await create(payload);
    setOpen(false);
    formRef.reset();
  };

  const togglePin = async (n: AppNotification) => {
    const updated = await update(n.id, { pinned: !n.pinned });
    if (updated) return; // state se actualiza en el contexto
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar notificación?')) return;
    await remove(id);
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
      const areas = areasUniverse.filter(area => form.get(`area-${area}`));
      target = { scope: 'areas', areas };
    } else if (scopeSel === 'global') {
      target = { scope: 'global' };
    }
    if (!title || !message) { alert('Título y Mensaje son obligatorios'); return; }
    const updated = await update(editing.id, { title, message, priority, target, scheduledAt });
    if (updated) setEditing(null);
  };

  if (loading) return <div className="text-center text-gray-600 dark:text-gray-300">Cargando notificaciones…</div>;

  return (
    <div className="space-y-6">
      {error && <div className="p-4 text-red-700 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800">{error}</div>}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Centro de Notificaciones</h2>
          <p className="text-gray-600 dark:text-gray-300">Crea notificaciones globales o dirigidas a áreas específicas</p>
        </div>
        {user?.isAdmin && (
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Nueva Notificación
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{items.length}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Globales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{items.filter(i => i.target.scope === 'global').length}</p>
            </div>
            <Globe2 className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Por Áreas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{items.filter(i => i.target.scope === 'areas').length}</p>
            </div>
            <Users2 className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Programadas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{items.filter(i => i.status === 'scheduled').length}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm lg:grid-cols-5 dark:bg-gray-800 dark:border-gray-700">
        <div className="relative lg:col-span-2">
          <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2 dark:text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título o mensaje…" className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500" />
        </div>
        <select value={scope} onChange={(e) => setScope(e.target.value as 'all'|'global'|'areas')} className="px-3 py-2 border rounded-lg dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
          <option value="all">Todas</option>
          <option value="global">Globales</option>
          <option value="areas">Por áreas</option>
        </select>
        <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="px-3 py-2 border rounded-lg dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
          <option value="all">Todas las áreas</option>
          {areasUniverse.map(a => (<option key={a} value={a}>{a}</option>))}
        </select>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">{filtered.length} notificaciones</div>
      </div>

      <div className="grid gap-4">
        {filtered.map(n => (
          <div key={n.id} className="p-5 bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${priorityBadge(n.priority)}`}>{PRIORITY_LABELS[n.priority]}</span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200">{targetLabel(n.target)}</span>
                  {n.status === 'scheduled' && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 inline-flex items-center gap-1 dark:bg-amber-900/30 dark:text-amber-300"><Calendar className="w-3 h-3" /> Programada</span>
                  )}
                  {n.pinned && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 inline-flex items-center gap-1 dark:bg-indigo-900/30 dark:text-indigo-300"><Pin className="w-3 h-3" /> Fijada</span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{n.title}</h3>
                <p className="text-gray-700 whitespace-pre-wrap dark:text-gray-200">{n.message}</p>
              </div>
              <div className="flex flex-col items-end gap-3 min-w-[220px]">
                <div className="text-sm text-right text-gray-600 dark:text-gray-300">
                  <div>Creada por <span className="font-medium text-gray-900 dark:text-gray-100">{n.createdBy}</span></div>
                  <div className="text-gray-700 dark:text-gray-200">{new Date(n.createdAt).toLocaleString('es-ES')}</div>
                  {n.scheduledAt && <div className="text-gray-700 dark:text-gray-200">Envío: {new Date(n.scheduledAt).toLocaleString('es-ES')}</div>}
                </div>
                {user?.isAdmin && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => togglePin(n)} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600" title={n.pinned ? 'Quitar fijación' : 'Fijar'}>
                      {n.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setEditing(n)} className="inline-flex items-center gap-2 px-3 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(n.id)} className="inline-flex items-center gap-2 px-3 py-2 text-red-700 rounded-lg bg-red-50 hover:bg-red-100 dark:text-red-300 dark:bg-red-900/30 dark:hover:bg-red-900/40" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-gray-600 dark:text-gray-300">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
          Sin notificaciones según los filtros
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="flex flex-col w-full max-w-2xl bg-white rounded-xl max-h-[90vh] dark:bg-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Nueva Notificación</h3>
              <button onClick={() => setOpen(false)} className="px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">✕</button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col flex-grow overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="nc-scope" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Ámbito</label>
                    <select id="nc-scope" name="scope" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" onChange={e => setCreateScope(e.target.value as 'global' | 'areas')}>
                      <option value="global">Global</option>
                      <option value="areas">Por áreas</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="nc-priority" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Prioridad</label>
                    <select id="nc-priority" name="priority" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" defaultValue="normal">
                      <option value="low">Baja</option>
                      <option value="normal">Normal</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                </div>
                {createScope === 'areas' && (
                  <fieldset>
                    <legend className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Áreas</legend>
                    <div className="grid grid-cols-2 gap-2 p-2 border rounded-lg max-h-40 overflow-y-auto dark:border-gray-700">
                      {areasUniverse.map(area => (
                        <label key={area} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                          <input type="checkbox" name={`area-${area}`} value={area} className="w-4 h-4" /> <span className="text-gray-800 dark:text-gray-200">{area}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                <div>
                  <label htmlFor="nc-title" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                  <input id="nc-title" name="title" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" required />
                </div>
                <div>
                  <label htmlFor="nc-message" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Mensaje</label>
                  <textarea id="nc-message" name="message" rows={4} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" required />
                </div>
                <div>
                  <label htmlFor="nc-scheduledAt" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Programar envío (opcional)</label>
                  <input id="nc-scheduledAt" name="scheduledAt" type="datetime-local" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 pt-2 mt-auto border-t border-gray-200 shrink-0 dark:border-gray-700">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 border rounded-lg dark:text-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
                <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg">
                  <Send className="w-4 h-4" /> Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="flex flex-col w-full max-w-2xl bg-white rounded-xl max-h-[90vh] dark:bg-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Editar Notificación</h3>
              <button onClick={() => setEditing(null)} className="px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="flex flex-col flex-grow overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="ne-scope" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Ámbito</label>
                    <select id="ne-scope" name="scope" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" defaultValue={normalizeTargetScope(editing.target.scope)} onChange={e => setEditScope(e.target.value as 'global' | 'areas')}>
                      <option value="global">Global</option>
                      <option value="areas">Por áreas</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="ne-priority" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Prioridad</label>
                    <select id="ne-priority" name="priority" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" defaultValue={editing.priority}>
                      <option value="low">Baja</option>
                      <option value="normal">Normal</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                </div>
                {editScope === 'areas' && (
                  <fieldset>
                    <legend className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Áreas</legend>
                    <div className="grid grid-cols-2 gap-2 p-2 border rounded-lg max-h-40 overflow-y-auto dark:border-gray-700">
                      {areasUniverse.map(area => (
                        <label key={area} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                          <input type="checkbox" name={`area-${area}`} value={area} defaultChecked={editing.target.scope === 'areas' && editing.target.areas.includes(area)} className="w-4 h-4" /> <span className="text-gray-800 dark:text-gray-200">{area}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                <div>
                  <label htmlFor="ne-title" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                  <input id="ne-title" name="title" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" defaultValue={editing.title} required />
                </div>
                <div>
                  <label htmlFor="ne-message" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Mensaje</label>
                  <textarea id="ne-message" name="message" rows={4} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" defaultValue={editing.message} required />
                </div>
                <div>
                  <label htmlFor="ne-scheduledAt" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Programar envío (opcional)</label>
                  <input id="ne-scheduledAt" name="scheduledAt" type="datetime-local" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" defaultValue={editing.scheduledAt} />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 pt-2 mt-auto border-t border-gray-200 shrink-0 dark:border-gray-700">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border rounded-lg dark:text-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
                <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg">
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

const NotificationsPage: React.FC = () => (
  <NotificationsProvider>
    <NotificationsCenterInner />
  </NotificationsProvider>
);

export default NotificationsPage;