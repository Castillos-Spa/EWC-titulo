# Plan de ampliación avanzada — Inventario IT (Mock)

Este documento define el alcance avanzado del módulo de Inventario IT en modo mock (sin backend). Incluye tabs, modelo de datos extendido, servicios mock a implementar, reglas de negocio, seeds y mapeo a UI.

## Estructura de navegación (tabs)

- Dashboard: KPIs, métricas y alertas.
- Activos: listado, filtros, detalle con historial y árbol padre-hijo.
- Licencias: pools (asignaciones, expiraciones), uso de seats.
- Movimientos: historial global consolidado, exportable.
- Catálogos: proveedores, ubicaciones, marcas/modelos.

## Modelo de datos (mock)

Entidades nuevas/extendidas (todas con `id: string`):

- ITVendor
  - nombre: string
  - contacto?: string, telefono?: string, email?: string
  - notas?: string
  - activo: boolean

- ITLocation
  - nombre: string
  - tipo: 'OFICINA' | 'BODEGA' | 'REMOTO'
  - direccion?: string
  - activo: boolean

- ITBrand
  - nombre: string
  - activo: boolean

- ITModel
  - nombre: string
  - marcaId: string (ITBrand)
  - categoria: ITAssetCategory (existente)

- ITAsset (extensión)
  - categoria, estado, etiqueta, serie, usuarioAsignado?, notas
  - vendorId?: string (ITVendor)
  - locationId?: string (ITLocation)
  - parentId?: string (soporta kits/conjuntos)
  - childrenIds?: string[]
  - especificaciones?: { cpu?: string; ramGB?: number; disco?: string; os?: string; imei?: string }

- ITLicensePool
  - producto: string (p.ej. "Microsoft 365 E3")
  - fabricante: string (p.ej. Microsoft)
  - tipo: 'PERPETUA' | 'SUSCRIPCION'
  - seatsTotales: number
  - seatsUsados: number
  - key?: string
  - venceEl?: string (ISO)
  - vendorId?: string (ITVendor)
  - notas?: string

- ITLicenseAssignment
  - poolId: string (ITLicensePool)
  - asignadoA: 'USUARIO' | 'ACTIVO'
  - usuarioId?: string
  - assetId?: string
  - desde: string (ISO)
  - hasta?: string (ISO)
  - estado: 'ACTIVA' | 'LIBERADA' | 'EXPIRADA'

- ITMovement (global)
  - fecha: string (ISO)
  - tipo:
    - 'ALTA' | 'ASIGNACION' | 'TRASLADO' | 'MANTENCION' | 'BAJA' | 'CAMBIO_ESTADO' | 'LICENCIA_ASIGNADA' | 'LICENCIA_LIBERADA'
  - actor?: string (usuario que ejecuta)
  - referenciaId?: string (assetId o poolId)
  - detalle?: string
  - metadata?: Record<string, unknown>

## Servicios mock (API in-memory)

- Vendors
  - listVendors(): ITVendor[]
  - createVendor(payload): ITVendor
  - updateVendor(id, payload): ITVendor
  - deactivateVendor(id)

- Locations
  - listLocations(): ITLocation[]
  - createLocation, updateLocation, deactivateLocation

- Brands y Models
  - listBrands(), createBrand(), updateBrand(), deactivateBrand()
  - listModels(filters?: { marcaId?, categoria? }), createModel(), updateModel(), deactivateModel()

- Assets (extensión)
  - linkChildAsset(parentId, childId)
  - unlinkChildAsset(parentId, childId)
  - transferAssetLocation(assetId, locationId, detalle?) → registra ITMovement 'TRASLADO'
  - assignAssetToUser(assetId, usuario, detalle?) → ITMovement 'ASIGNACION'
  - unassignAsset(assetId, detalle?)
  - getAssetTree(assetId): ITAsset & { children: ITAsset[] }

- Licenses
  - listLicensePools(filters?)
  - getLicensePool(id)
  - createLicensePool, updateLicensePool
  - assignLicense({ poolId, target: { usuarioId | assetId }, desde? }) → valida seats disponibles; genera 'LICENCIA_ASIGNADA'
  - releaseLicense(assignmentId) → 'LICENCIA_LIBERADA'
  - listLicenseAssignments(poolId?, filters?)
  - seatsAvailable(poolId): number

- Movements (global)
  - listGlobalMovements(filters?: { desde?, hasta?, tipo?, referenciaId? }): ITMovement[]
  - recordMovement(interno)

- Dashboard
  - getDashboardKPIs(): {
      activosPorEstado: Record<ITAssetStatus, number>;
      proximasExpLicencias: Array<{ poolId: string; dias: number }>;
      utilizacionLicencias: Array<{ poolId: string; ratio: number }>;
      rotacionActivos30d: number;
    }

Cada función debe simular latencia `simulateLatency(ms=200-500)` y lanzar errores coherentes para validar la UI.

## Reglas de negocio y validaciones

- Licencias
  - No asignar si `seatsUsados >= seatsTotales`.
  - Una asignación activa por target y pool (usuario/activo) a la vez.
  - Al liberar, decrementar `seatsUsados` y marcar estado `LIBERADA`.

- Activos
  - Estado `RETIRADO` no permite nuevas asignaciones ni traslados.
  - Árbol padre-hijo: impedir ciclos (un hijo no puede ser ancestro del padre).
  - Traslado siempre genera ITMovement 'TRASLADO' con `locationId` destino.

- Movimientos
  - Siempre registrar cambios relevantes (estado, asignación, traslados, alta/baja, licencias).

## Seeds sugeridos (mock)

- Vendors: "TechSupplier", "GlobalSoft", "CompuWorld".
- Locations: "Oficina Central" (OFICINA), "Bodega 1" (BODEGA), "Remoto" (REMOTO).
- Brands/Models: { Lenovo, ThinkPad T14 }, { Dell, Latitude 5440 }, { Apple, MacBook Air }.
- LicensePools: M365 E3 (suscripción, 50 seats), Adobe CC (suscripción, 10), VS Pro (perpetua, 5).
- Activos: 8–12 activos distribuidos en estados, con 2–3 relaciones padre-hijo (laptop → dock → periféricos).
- Asignaciones de licencias: 4–6 activos/usuarios con diferentes pools.

## Mapeo a UI

- Dashboard
  - Tarjetas: activos por estado, utilización de licencias, expiraciones próximas (<30 días), rotación 30d.
  - Gráficas simples (barras/torta mock), tabla de alertas.

- Activos
  - Listado con filtros (categoría, estado, vendor, ubicación).
  - Detalle con árbol padre-hijo y licencias vinculadas.
  - Acciones: crear, editar, asignar usuario, trasladar, vincular/desvincular hijo, cambiar estado.

- Licencias
  - Tabla de pools con calculadora de seats usados/disponibles y próximos vencimientos.
  - Drawer de asignaciones por pool; acciones asignar/liberar.

- Movimientos
  - Tabla global paginada/filtrable; exportación CSV.

- Catálogos
  - CRUD básico para Vendors, Locations, Brands, Models.

## Ejemplos de payloads (JSON)

- Crear pool de licencias
```json
{
  "producto": "Microsoft 365 E3",
  "fabricante": "Microsoft",
  "tipo": "SUSCRIPCION",
  "seatsTotales": 50,
  "venceEl": "2026-06-30",
  "vendorId": "ven_1"
}
```

- Asignar licencia a activo
```json
{
  "poolId": "lp_1",
  "target": { "assetId": "it_123" },
  "desde": "2025-11-07"
}
```

- Vincular activo hijo
```json
{ "parentId": "it_100", "childId": "it_101" }
```

## Mapeo futuro a backend/Prisma (referencial)

- Tablas: vendors, locations, brands, models, it_assets, license_pools, license_assignments, it_movements.
- Índices: `license_assignments(pool_id, estado)`, `it_assets(parent_id)`, `it_movements(fecha, tipo)`.
- Restricciones: FK y checks equivalentes a las reglas de negocio anteriores.

---

Checklist de implementación mock (orden sugerido):
1) Catálogos (Vendors/Locations/Brands/Models) + seeds.
2) Extender Assets con parent/child y ubicación + acciones.
3) LicensePools + asignaciones + validaciones + KPIs.
4) Movements globales consolidando eventos.
5) Dashboard KPIs + alertas.
6) Export CSV (movements) y utilidades.
