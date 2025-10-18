import { useMemo, useState } from 'react';
import { TicketsProvider, useTicketsContext } from '../context/TicketsContext';
import CreateTicketModal from '../components/CreateTicketModal';
import TicketDetailModal from '../components/TicketDetailModal';
import { TicketStatus, TicketPriority } from '../../../types/Ticket';

function TicketsInnerPage() {
  const {
    items, loading, error,
    search, view, status, category, priority,
    setSearch, setStatus, setCategory, setPriority,
  } = useTicketsContext();

  const [selected, setSelected] = useState<import('../../../types/Ticket').Ticket | null>(null);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items;
    if (q) {
      list = list.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        String(t.id).includes(q)
      );
    }
    if (status !== 'all') list = list.filter((t) => t.status === status);
    if (category !== 'all') list = list.filter((t) => t.category === category);
    if (priority !== 'all') list = list.filter((t) => t.priority === priority);
    return list;
  }, [items, search, status, category, priority]);

  const categories = useMemo(() => {
    return Array.from(new Set(items.map((t) => t.category))).sort((a, b) => String(a).localeCompare(String(b)));
  }, [items]);

  const [openCreate, setOpenCreate] = useState(false);

  if (loading) return <div className="p-4">Cargando tickets…</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sistema de Tickets</h2>
          <p className="text-gray-600 dark:text-gray-400">Gestiona solicitudes y seguimiento</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            placeholder="Buscar"
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700"
          />
          <select
            value={status}
            onChange={(e) => {
              const allowed = ['all', ...Object.values(TicketStatus)] as const;
              const v = e.target.value as typeof allowed[number];
              setStatus(allowed.includes(v) ? v : 'all');
            }}
            className="px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700"
          >
            <option value="all">Todos</option>
            {Object.values(TicketStatus).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => {
              const allowed = ['all', ...Object.values(TicketPriority)] as const;
              const v = e.target.value as typeof allowed[number];
              setPriority(allowed.includes(v) ? v : 'all');
            }}
            className="px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700"
          >
            <option value="all">Todas las prioridades</option>
            {Object.values(TicketPriority).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={() => setOpenCreate(true)} className="px-3 py-2 rounded-lg bg-blue-600 text-white">Nuevo</button>
        </div>
      </div>

      {/* Vista */}
      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.values(TicketStatus).map((s) => (
            <div key={s} className="rounded-lg border dark:border-slate-700 p-3">
              <div className="font-semibold mb-2">{s}</div>
              <div className="space-y-2">
                {filtered.filter((t) => t.status === s).map((t) => (
                  <button key={t.id} onClick={() => setSelected(t)} className="w-full text-left p-3 rounded-lg border dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-sm text-gray-500">#{t.id}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border dark:border-slate-700 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">Título</th>
                <th className="text-left p-2">Estado</th>
                <th className="text-left p-2">Prioridad</th>
                <th className="text-left p-2">Categoría</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-t dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer" onClick={() => setSelected(t)}>
                  <td className="p-2">{t.id}</td>
                  <td className="p-2">{t.title}</td>
                  <td className="p-2">{t.status}</td>
                  <td className="p-2">{t.priority}</td>
                  <td className="p-2">{t.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && (
        <TicketDetailModal open={!!selected} ticket={selected} onClose={() => setSelected(null)} />
      )}
      <CreateTicketModal open={openCreate} onClose={() => setOpenCreate(false)} />
    </div>
  );
}

export default function TicketsPage() {
  return (
    <TicketsProvider>
      <TicketsInnerPage />
    </TicketsProvider>
  );
}
