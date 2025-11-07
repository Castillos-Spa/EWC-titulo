import type { ITAsset, ITMovement } from '../types';

interface Props {
  asset: ITAsset | null;
  movements: ITMovement[];
}

export default function ITAssetDetail({ asset, movements }: Readonly<Props>) {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
      <h3 className="mb-3 text-sm font-semibold">Detalle del activo</h3>
      {!asset && <p className="text-sm text-slate-500">Selecciona un activo.</p>}
      {asset && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Asset Tag</span><span className="font-mono text-xs">{asset.assetTag}</span></div>
          {asset.serialNumber && <div className="flex justify-between"><span className="text-slate-500">Serie</span><span className="font-mono text-xs">{asset.serialNumber}</span></div>}
          <div className="flex justify-between"><span className="text-slate-500">Nombre</span><span>{asset.nombre}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Categoría</span><span>{asset.categoria}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Ubicación</span><span>{asset.ubicacion}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Estado</span><span>{asset.estado}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Asignado a</span><span>{asset.asignadoA ?? '-'}</span></div>
          {asset.fechaCompra && <div className="flex justify-between"><span className="text-slate-500">Compra</span><span>{new Date(asset.fechaCompra).toLocaleDateString()}</span></div>}
          {asset.garantiaHasta && <div className="flex justify-between"><span className="text-slate-500">Garantía hasta</span><span>{new Date(asset.garantiaHasta).toLocaleDateString()}</span></div>}
          {asset.notas && <div className="text-xs text-slate-500">Notas: {asset.notas}</div>}
        </div>
      )}
      <hr className="my-4 border-slate-200/60 dark:border-white/10" />
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Movimientos</h4>
      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {movements.length === 0 && <p className="text-xs text-slate-500">Sin movimientos.</p>}
        {movements.map(m => (
          <div key={m.id} className="rounded-lg border border-slate-200/60 bg-white/80 p-2 text-xs shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex justify-between"><span>{new Date(m.fecha).toLocaleString()}</span><span className="font-medium">{m.tipo}</span></div>
            <div className="mt-1 text-slate-600 dark:text-blue-100/80">{m.detalle}</div>
            <div className="mt-1 text-[10px] text-slate-400">Usuario: {m.usuario}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
