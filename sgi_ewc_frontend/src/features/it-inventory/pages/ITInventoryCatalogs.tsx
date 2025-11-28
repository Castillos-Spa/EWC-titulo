import { useEffect, useState } from 'react';
import { Building2, MapPin, Tag, Shapes } from 'lucide-react';
import type { ITVendor, ITLocation, ITBrand, ITModel, ITLocationType, ITAssetCategory } from '../types';
import {
  listVendors,
  listLocations,
  listBrands,
  listModels,
  createVendor,
  createLocation,
  createBrand,
  createModel,
  toggleVendorActive,
  toggleLocationActive,
  toggleBrandActive,
  toggleModelActive,
} from '../services/mockItCatalogsService';

const locationTypes: ITLocationType[] = ['OFICINA', 'BODEGA', 'REMOTO'];
const categories: ITAssetCategory[] = ['Laptop','Monitor','Licencia','Periférico','Desktop','Impresora','Servidor'];

export default function ITInventoryCatalogs() {
  const [vendors, setVendors] = useState<ITVendor[]>([]);
  const [locations, setLocations] = useState<ITLocation[]>([]);
  const [brands, setBrands] = useState<ITBrand[]>([]);
  const [models, setModels] = useState<ITModel[]>([]);
  const [loading, setLoading] = useState(true);

  const [vendorForm, setVendorForm] = useState({ nombre: '', contacto: '', telefono: '', email: '' });
  const [locationForm, setLocationForm] = useState({ nombre: '', tipo: 'OFICINA' as ITLocationType, direccion: '' });
  const [brandForm, setBrandForm] = useState({ nombre: '' });
  const [modelForm, setModelForm] = useState({ nombre: '', marcaId: '', categoria: 'Laptop' as ITAssetCategory });
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});

  const loadAll = async () => {
    setLoading(true);
    const [v, l, b, m] = await Promise.all([listVendors(), listLocations(), listBrands(), listModels()]);
    setVendors(v);
    setLocations(l);
    setBrands(b);
    setModels(m);
    setLoading(false);
    if (!modelForm.marcaId && b.length) {
      setModelForm(prev => ({ ...prev, marcaId: b[0].id }));
    }
  };

  useEffect(() => {
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.nombre.trim()) return;
    setSaving(prev => ({ ...prev, vendor: true }));
    await createVendor(vendorForm);
    setVendorForm({ nombre: '', contacto: '', telefono: '', email: '' });
    await loadAll();
    setSaving(prev => ({ ...prev, vendor: false }));
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationForm.nombre.trim()) return;
    setSaving(prev => ({ ...prev, location: true }));
    await createLocation(locationForm);
    setLocationForm({ nombre: '', tipo: 'OFICINA', direccion: '' });
    await loadAll();
    setSaving(prev => ({ ...prev, location: false }));
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandForm.nombre.trim()) return;
    setSaving(prev => ({ ...prev, brand: true }));
    await createBrand(brandForm);
    setBrandForm({ nombre: '' });
    await loadAll();
    setSaving(prev => ({ ...prev, brand: false }));
  };

  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelForm.nombre.trim() || !modelForm.marcaId) return;
    setSaving(prev => ({ ...prev, model: true }));
    await createModel(modelForm);
    setModelForm(prev => ({ ...prev, nombre: '' }));
    await loadAll();
    setSaving(prev => ({ ...prev, model: false }));
  };

  const toggleActive = async (type: 'vendor' | 'location' | 'brand' | 'model', id: string) => {
    setSaving(prev => ({ ...prev, [`toggle-${type}-${id}`]: true }));
    try {
      if (type === 'vendor') await toggleVendorActive(id);
      if (type === 'location') await toggleLocationActive(id);
      if (type === 'brand') await toggleBrandActive(id);
      if (type === 'model') await toggleModelActive(id);
      await loadAll();
    } finally {
      setSaving(prev => ({ ...prev, [`toggle-${type}-${id}`]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Catálogos maestros</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">Proveedores, ubicaciones, marcas y modelos utilizados por el módulo de inventario IT.</p>
      </div>

      {loading && <div className="rounded-xl border border-slate-200/60 bg-white/70 p-4 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/40">Cargando catálogos…</div>}

      {!loading && (
        <div className="space-y-6">
          {/* Vendors */}
          <section className="rounded-2xl border border-slate-200/60 bg-white/80 p-5 dark:border-white/10 dark:bg-slate-900/40">
            <header className="mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Building2 className="h-5 w-5" />
              <div>
                <h3 className="text-base font-semibold">Proveedores</h3>
                <p className="text-xs text-slate-500">Contactos autorizados para compra y soporte.</p>
              </div>
            </header>
            <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                    <tr>
                      <th className="px-3 py-2">Nombre</th>
                      <th className="px-3 py-2">Contacto</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map(v => (
                      <tr key={v.id} className="border-t border-slate-100/70 text-xs dark:border-white/5">
                        <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">{v.nombre}</td>
                        <td className="px-3 py-2">{v.contacto ?? '—'}<div className="text-[11px] text-slate-500">{v.telefono ?? ''}</div></td>
                        <td className="px-3 py-2">{v.email ?? '—'}</td>
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => toggleActive('vendor', v.id)} disabled={saving[`toggle-vendor-${v.id}`]} className={`rounded-full px-3 py-0.5 text-[11px] font-semibold ${v.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'} dark:bg-opacity-30`}>
                            {v.activo ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!vendors.length && <tr><td colSpan={4} className="px-3 py-4 text-center text-slate-500">Sin registros</td></tr>}
                  </tbody>
                </table>
              </div>
              <form onSubmit={handleCreateVendor} className="space-y-3 rounded-xl border border-slate-200/60 bg-white/90 p-4 text-xs dark:border-white/10 dark:bg-slate-900/60">
                <div className="font-semibold text-slate-700 dark:text-slate-100">Nuevo proveedor</div>
                <div className="space-y-1">
                  <label htmlFor="vendor-nombre" className="text-[11px] font-medium text-slate-500">Nombre</label>
                  <input id="vendor-nombre" value={vendorForm.nombre} onChange={e => setVendorForm(prev => ({ ...prev, nombre: e.target.value }))} className="w-full rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800" required />
                </div>
                <div className="space-y-1">
                  <label htmlFor="vendor-contacto" className="text-[11px] font-medium text-slate-500">Contacto</label>
                  <input id="vendor-contacto" value={vendorForm.contacto} onChange={e => setVendorForm(prev => ({ ...prev, contacto: e.target.value }))} className="w-full rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800" />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input placeholder="Teléfono" value={vendorForm.telefono} onChange={e => setVendorForm(prev => ({ ...prev, telefono: e.target.value }))} className="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800" />
                  <input placeholder="Email" type="email" value={vendorForm.email} onChange={e => setVendorForm(prev => ({ ...prev, email: e.target.value }))} className="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800" />
                </div>
                <button type="submit" disabled={saving.vendor} className="w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-semibold text-white disabled:opacity-40">Agregar proveedor</button>
              </form>
            </div>
          </section>

          {/* Locations */}
          <section className="rounded-2xl border border-slate-200/60 bg-white/80 p-5 dark:border-white/10 dark:bg-slate-900/40">
            <header className="mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <MapPin className="h-5 w-5" />
              <div>
                <h3 className="text-base font-semibold">Ubicaciones</h3>
                <p className="text-xs text-slate-500">Bodegas, oficinas y ubicaciones remotas.</p>
              </div>
            </header>
            <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                    <tr>
                      <th className="px-3 py-2">Nombre</th>
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Dirección</th>
                      <th className="px-3 py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locations.map(l => (
                      <tr key={l.id} className="border-top border-slate-100/70 text-xs dark:border-white/5">
                        <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">{l.nombre}</td>
                        <td className="px-3 py-2">{l.tipo}</td>
                        <td className="px-3 py-2">{l.direccion ?? '—'}</td>
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => toggleActive('location', l.id)} disabled={saving[`toggle-location-${l.id}`]} className={`rounded-full px-3 py-0.5 text-[11px] font-semibold ${l.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                            {l.activo ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!locations.length && <tr><td colSpan={4} className="px-3 py-4 text-center text-slate-500">Sin registros</td></tr>}
                  </tbody>
                </table>
              </div>
              <form onSubmit={handleCreateLocation} className="space-y-3 rounded-xl border border-slate-200/60 bg-white/90 p-4 text-xs dark:border-white/10 dark:bg-slate-900/60">
                <div className="font-semibold text-slate-700 dark:text-slate-100">Nueva ubicación</div>
                <div className="space-y-1">
                  <label htmlFor="location-nombre" className="text-[11px] font-medium text-slate-500">Nombre</label>
                  <input id="location-nombre" value={locationForm.nombre} onChange={e => setLocationForm(prev => ({ ...prev, nombre: e.target.value }))} className="w-full rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800" required />
                </div>
                <div className="space-y-1">
                  <label htmlFor="location-tipo" className="text-[11px] font-medium text-slate-500">Tipo</label>
                  <select id="location-tipo" value={locationForm.tipo} onChange={e => setLocationForm(prev => ({ ...prev, tipo: e.target.value as ITLocationType }))} className="w-full rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800">
                    {locationTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <input placeholder="Dirección" value={locationForm.direccion} onChange={e => setLocationForm(prev => ({ ...prev, direccion: e.target.value }))} className="w-full rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800" />
                <button type="submit" disabled={saving.location} className="w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-semibold text-white disabled:opacity-40">Agregar ubicación</button>
              </form>
            </div>
          </section>

          {/* Brands */}
          <section className="rounded-2xl border border-slate-200/60 bg-white/80 p-5 dark:border-white/10 dark:bg-slate-900/40">
            <header className="mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Tag className="h-5 w-5" />
              <div>
                <h3 className="text-base font-semibold">Marcas</h3>
                <p className="text-xs text-slate-500">Fabricantes aprobados.</p>
              </div>
            </header>
            <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                    <tr><th className="px-3 py-2">Nombre</th><th className="px-3 py-2">Estado</th></tr>
                  </thead>
                  <tbody>
                    {brands.map(b => (
                      <tr key={b.id} className="border-top border-slate-100/70 text-xs dark:border-white/5">
                        <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">{b.nombre}</td>
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => toggleActive('brand', b.id)} disabled={saving[`toggle-brand-${b.id}`]} className={`rounded-full px-3 py-0.5 text-[11px] font-semibold ${b.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                            {b.activo ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!brands.length && <tr><td colSpan={2} className="px-3 py-4 text-center text-slate-500">Sin registros</td></tr>}
                  </tbody>
                </table>
              </div>
              <form onSubmit={handleCreateBrand} className="space-y-3 rounded-xl border border-slate-200/60 bg-white/90 p-4 text-xs dark:border-white/10 dark:bg-slate-900/60">
                <div className="font-semibold text-slate-700 dark:text-slate-100">Nueva marca</div>
                <input placeholder="Nombre" value={brandForm.nombre} onChange={e => setBrandForm({ nombre: e.target.value })} className="w-full rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800" required />
                <button type="submit" disabled={saving.brand} className="w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-semibold text-white disabled:opacity-40">Agregar marca</button>
              </form>
            </div>
          </section>

          {/* Models */}
          <section className="rounded-2xl border border-slate-200/60 bg-white/80 p-5 dark:border-white/10 dark:bg-slate-900/40">
            <header className="mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Shapes className="h-5 w-5" />
              <div>
                <h3 className="text-base font-semibold">Modelos</h3>
                <p className="text-xs text-slate-500">Modelos asociados a marca y categoría.</p>
              </div>
            </header>
            <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                    <tr>
                      <th className="px-3 py-2">Modelo</th>
                      <th className="px-3 py-2">Marca</th>
                      <th className="px-3 py-2">Categoría</th>
                      <th className="px-3 py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map(m => {
                      const brandName = brands.find(b => b.id === m.marcaId)?.nombre ?? '—';
                      return (
                        <tr key={m.id} className="border-top border-slate-100/70 text-xs dark:border-white/5">
                          <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">{m.nombre}</td>
                          <td className="px-3 py-2">{brandName}</td>
                          <td className="px-3 py-2">{m.categoria}</td>
                          <td className="px-3 py-2">
                            <button type="button" onClick={() => toggleActive('model', m.id)} disabled={saving[`toggle-model-${m.id}`]} className={`rounded-full px-3 py-0.5 text-[11px] font-semibold ${m.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                              {m.activo ? 'Activo' : 'Inactivo'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {!models.length && <tr><td colSpan={4} className="px-3 py-4 text-center text-slate-500">Sin registros</td></tr>}
                  </tbody>
                </table>
              </div>
              <form onSubmit={handleCreateModel} className="space-y-3 rounded-xl border border-slate-200/60 bg-white/90 p-4 text-xs dark:border-white/10 dark:bg-slate-900/60">
                <div className="font-semibold text-slate-700 dark:text-slate-100">Nuevo modelo</div>
                <input placeholder="Nombre del modelo" value={modelForm.nombre} onChange={e => setModelForm(prev => ({ ...prev, nombre: e.target.value }))} className="w-full rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800" required />
                <div className="space-y-1">
                  <label htmlFor="model-marca" className="text-[11px] font-medium text-slate-500">Marca</label>
                  <select id="model-marca" value={modelForm.marcaId} onChange={e => setModelForm(prev => ({ ...prev, marcaId: e.target.value }))} className="w-full rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800" required>
                    <option value="" disabled>Selecciona marca</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="model-categoria" className="text-[11px] font-medium text-slate-500">Categoría</label>
                  <select id="model-categoria" value={modelForm.categoria} onChange={e => setModelForm(prev => ({ ...prev, categoria: e.target.value as ITAssetCategory }))} className="w-full rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button type="submit" disabled={saving.model} className="w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-semibold text-white disabled:opacity-40">Agregar modelo</button>
              </form>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
