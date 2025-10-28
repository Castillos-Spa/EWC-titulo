import { useMemo } from 'react';
import { Building2, Car, Hash, Tag, Radio, Truck, UserCircle2, Wrench } from 'lucide-react';
import { useStandardFleet } from '../context/StandardFleetContext';

const statusBadge: Record<string, string> = {
  disponible: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
  en_mantenimiento: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
  inactivo: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200',
  en_uso: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200',
};

export default function StandardVehicleDirectory() {
  const { items, loading, error, search, setSearch, openEdit } = useStandardFleet();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(v => {
      const hay = [
        v.empresaId,
        v.codigo ?? '',
        v.nombre ?? '',
        v.patente,
        v.marca,
        v.modelo,
        v.segmento ?? '',
        v.centroCosto ?? '',
        v.region ?? '',
        v.manager ?? '',
        v.areaAsignada ?? '',
        (v.tags ?? []).join(' '),
      ].map(x => String(x).toLowerCase()).join(' ');
      return hay.includes(q);
    });
  }, [items, search]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 px-6 py-6 shadow-xl shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_rgba(191,219,254,0.05))] dark:bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.2),_rgba(15,23,42,0.4))]" />
      <div className="relative space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
            <Car className="h-4 w-4" />
            <span>Directorio estándar</span>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar empresa, código, patente, marca, modelo…"
            className="w-80 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-blue-200/60 dark:focus:ring-sky-500"
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-600 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-100">{error}</div>
        )}

        {loading && (
          <div className="rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-8 text-center text-sm text-slate-500 shadow-inner dark:border-white/10 dark:bg-white/5 dark:text-blue-100/80">Cargando…</div>
        )}

        {!loading && filtered.length === 0 && !error && (
          <div className="rounded-3xl border border-slate-200/60 bg-white/70 px-8 py-12 text-center text-slate-500 shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/5 dark:text-blue-100/80">
            <Truck className="mx-auto mb-4 h-12 w-12 text-slate-400 dark:text-blue-200/60" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-100">Sin resultados</h3>
            <p className="mt-2 text-sm">Ajusta la búsqueda o agrega una nueva unidad.</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(v => (
            <article key={v.id} className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-lg shadow-slate-200/40 transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sky-600 shadow-inner shadow-sky-200/70 dark:from-sky-500/30 dark:to-indigo-500/30 dark:text-blue-100">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{v.patente}</h3>
                      <span className="rounded-full border border-sky-200 bg-white/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-100">{v.tipo || 'Vehículo'}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] ${statusBadge[v.estado] || statusBadge['disponible']}`}>
                        <Radio className="mr-1 inline-block h-3 w-3" />{v.estado}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-blue-200/80">{v.marca} {v.modelo} • {v.capacidad?.toLocaleString() ?? 0} L</p>
                  </div>
                </div>
                <button
                  onClick={() => openEdit(v)}
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
                >Editar</button>
              </div>

              <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-slate-400" /><div><dt className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Empresa</dt><dd className="font-semibold text-slate-800 dark:text-white">{v.empresaId}</dd></div></div>
                <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-slate-400" /><div><dt className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Código</dt><dd className="font-semibold text-slate-800 dark:text-white">{v.codigo || '—'}</dd></div></div>
                <div className="flex items-center gap-2"><Tag className="h-4 w-4 text-slate-400" /><div><dt className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Nombre</dt><dd className="font-semibold text-slate-800 dark:text-white">{v.nombre || '—'}</dd></div></div>
                <div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-slate-400" /><div><dt className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Segmento</dt><dd className="font-semibold text-slate-800 dark:text-white">{v.segmento || '—'}</dd></div></div>
                <div className="flex items-center gap-2"><UserCircle2 className="h-4 w-4 text-slate-400" /><div><dt className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Manager</dt><dd className="font-semibold text-slate-800 dark:text-white">{v.manager || '—'}</dd></div></div>
                <div className="flex items-center gap-2"><Car className="h-4 w-4 text-slate-400" /><div><dt className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Centro de costo</dt><dd className="font-semibold text-slate-800 dark:text-white">{v.centroCosto || '—'}</dd></div></div>
              </dl>

              {Array.isArray(v.tags) && v.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {v.tags.map((t) => (
                    <span key={t} className="rounded-full border border-slate-200 bg-white/70 px-2 py-0.5 text-[11px] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-100">{t}</span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
