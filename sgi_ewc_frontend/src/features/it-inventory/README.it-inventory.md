# Inventario IT (Mock) – Estándar y Contrato Backend

Este documento define buenas prácticas y el contrato sugerido para implementar el módulo real de Inventario IT. El frontend actual es un mock in-memory y espera que el backend provea endpoints REST/JSON (o GraphQL equivalente). Se sigue una visión centrada en trazabilidad, gobernanza de activos y control de estado.

---
## 1. Objetivos del Inventario IT
- Trazar ciclo de vida completo de cada activo (alta → asignación → soporte/reparación → devolución → baja/retiro).
- Mantener visibilidad de estado, ubicación y responsable/asignatario.
- Gestionar garantías, fechas de compra y proveedor para soporte postventa.
- Auditar movimientos (quién, cuándo, qué cambio) para control interno y cumplimiento.
- Diferenciar tipos: hardware (Laptop, Desktop, Monitor, Periférico, Impresora, Servidor) y software/licencias.

---
## 2. Modelo de Datos Propuesto
### 2.1. Entidad ITAsset
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|------------|-------------|
| id | number | Sí | Identificador interno. |
| assetTag | string | Sí | Etiqueta única corporativa. Ej: IT-NTB-0001. |
| serialNumber | string | No | Número de serie físico/fabricante. |
| nombre | string | Sí | Nombre/Modelo legible. |
| categoria | enum( Laptop | Monitor | Licencia | Periférico | Desktop | Impresora | Servidor ) | Sí | Tipo de activo. |
| ubicacion | string | Sí | Ubicación física o lógica ("Bodega IT", "Escritorio Juan", "N/A" para licencias). |
| estado | enum( EN_STOCK | ASIGNADO | EN_REPARACION | RETIRADO ) | Sí | Estado operacional. |
| asignadoA | string | Condicional | Correo/ID usuario si estado = ASIGNADO. |
| proveedor | string | No | Vendor principal. |
| fechaCompra | ISO string (date) | No | Fecha de adquisición. |
| garantiaHasta | ISO string (date) | No | Fin de garantía. |
| notas | string | No | Observaciones operativas. |
| createdAt | ISO datetime | Sí | Alta en sistema. |
| updatedAt | ISO datetime | Sí | Última modificación. |
| retiredReason | string | Condicional | Motivo de baja si estado = RETIRADO. |

### 2.2. Entidad ITMovement
| Campo | Tipo | Obligatorio | Descripción |
|-------|------|------------|-------------|
| id | number | Sí | Identificador del movimiento. |
| assetId | number | Sí | Referencia a ITAsset. |
| tipo | enum( ALTA | ASIGNACION | DEVOLUCION | REPARACION | BAJA | CAMBIO_UBICACION | ACTUALIZACION ) | Sí | Tipo de evento. |
| fecha | ISO datetime | Sí | Momento del evento. |
| detalle | string | Sí | Texto libre describiendo el contexto. |
| usuario | string | Sí | Actor que ejecuta (correo o id). |
| metadata | JSON | No | Campos extendidos (por ejemplo ticketId, ordenServicio, etc.). |

### 2.3. Consideraciones adicionales
- Un movimiento nunca se modifica (inmutabilidad). Correcciones se registran con nuevo movimiento tipo ACTUALIZACION.
- Sugerencia: tabla separada para licencias (si se requiere pool, expiración, seats). Para simplicidad inicial se unifica.

---
## 3. Reglas de Negocio
| Regla | Descripción |
|-------|-------------|
| RN1 | `assetTag` único global. Validar en alta. |
| RN2 | Cambio de `estado` genera movimiento correspondiente. |
| RN3 | Estado ASIGNADO requiere `asignadoA`. Estado RETIRADO requiere `retiredReason`. |
| RN4 | Pasar de RETIRADO a otro estado solo permitido a rol administrador (normalmente prohibido). |
| RN5 | Cambios de `ubicacion` generan movimiento CAMBIO_UBICACION con detalle anterior/nuevo. |
| RN6 | Reparación: al iniciar se cambia a EN_REPARACION con movimiento REPARACION; al finalizar se genera DEVOLUCION o ASIGNACION según corresponda. |
| RN7 | Garantía vencida: alertas si `garantiaHasta < now()` y estado distinto de RETIRADO. |
| RN8 | Serial obligatorio para categorías físicas excepto Licencia y Periférico opcional. |

---
## 4. Endpoints REST Sugeridos
Base path: `/api/it-assets`

### 4.1. Listar activos
GET `/api/it-assets?search=&categoria=&estado=&page=1&pageSize=25&sort=createdAt:desc`
Response:
```
{
  "items": [ITAsset],
  "page": 1,
  "pageSize": 25,
  "total": 157
}
```
Notas:
- `search` busca en assetTag, serialNumber, nombre, ubicacion, asignadoA.
- `sort` formato campo:direction.

### 4.2. Obtener detalle
GET `/api/it-assets/{id}` → ITAsset

### 4.3. Crear activo
POST `/api/it-assets`
Body:
```
{
  "assetTag": "IT-NTB-0456",
  "serialNumber": "SN987XXX",
  "nombre": "Lenovo ThinkPad T14",
  "categoria": "Laptop",
  "ubicacion": "Bodega IT",
  "proveedor": "Lenovo",
  "fechaCompra": "2025-05-10",
  "garantiaHasta": "2028-05-10",
  "notas": "Config estándar",
  "estado": "EN_STOCK"
}
```
Response: 201 ITAsset
Errores: 409 assetTag duplicado, 422 validación.

### 4.4. Actualizar atributos (no estado)
PATCH `/api/it-assets/{id}`
Body (campos parciales permitidos): assetTag (si política lo permite), nombre, ubicacion, proveedor, garantiaHasta, notas, asignadoA (solo si estado ASIGNADO).
Response: ITAsset

### 4.5. Cambiar estado
POST `/api/it-assets/{id}/state`
Body:
```
{ "estado": "ASIGNADO", "asignadoA": "juan@empresa.com", "detalle": "Asignación nueva", "retiredReason": null }
```
Validaciones:
- ASIGNADO → requiere asignadoA.
- RETIRADO → requiere retiredReason.
Response: ITAsset
Side effect: crea ITMovement.

### 4.6. Registrar cambio de ubicación
POST `/api/it-assets/{id}/location`
Body:
```
{ "ubicacion": "Escritorio Juan", "detalle": "Entrega física" }
```
Response: ITAsset (ubicación actualizada)
Movimiento CAMBIO_UBICACION.

### 4.7. Listar movimientos de un activo
GET `/api/it-assets/{id}/movements?tipo=&page=1&pageSize=50`
Response:
```
{
  "items": [ITMovement],
  "page": 1,
  "pageSize": 50,
  "total": 12
}
```

### 4.8. Movimientos globales (auditoría)
GET `/api/it-assets/movements?search=&tipo=&desde=&hasta=&page=&pageSize=`
Permite filtrar por rango de fechas y tipo para auditorías.

### 4.9. Búsqueda por assetTag exacto
GET `/api/it-assets/tag/{assetTag}` → ITAsset | 404

### 4.10. Reporte de KPIs
GET `/api/it-assets/kpis`
Response ejemplo:
```
{
  "total": 250,
  "porEstado": {
    "EN_STOCK": 120,
    "ASIGNADO": 95,
    "EN_REPARACION": 8,
    "RETIRADO": 27
  },
  "garantiaExpirada": 15,
  "asignadosSinSerial": 0
}
```

---
## 5. Roles y Permisos (Sugerencia)
| Acción | Rol Básico | Rol IT | Admin |
|--------|------------|--------|-------|
| Listar | Sí | Sí | Sí |
| Ver detalle | Sí | Sí | Sí |
| Crear activo | No | Sí | Sí |
| Editar datos | No | Sí | Sí |
| Cambiar estado | No | Sí | Sí |
| Retirar activo | No | Sí | Sí |
| Revertir retiro | No | No | Sí (excepción) |
| Movimientos globales | No | Sí | Sí |
| KPIs | Sí | Sí | Sí |

---
## 6. Validaciones Clave
- `assetTag` regex sugerido: `^[A-Z]{2,4}-[A-Z]{2,4}-\d{3,5}$` (flexible, adaptar según convención interna).
- `serialNumber` única dentro de la misma categoría opcional (evitar duplicados accidentales).
- `fechaCompra <= garantiaHasta` si ambos presentes.
- No permitir cambiar estado a ASIGNADO si ya está ASIGNADO sin movimiento DEVOLUCION intermedio.
- Si ciclo estado requiere orden (opcional): EN_STOCK → ASIGNADO → EN_REPARACION → EN_STOCK/ASIGNADO → RETIRADO (terminal).

---
## 7. Errores y Códigos HTTP
| Código | Caso |
|--------|------|
| 400 | Formato de parámetros incorrecto |
| 401 | No autenticado |
| 403 | Sin permisos para acción |
| 404 | Activo o movimiento inexistente |
| 409 | assetTag duplicado / conflicto de estado |
| 422 | Validación de negocio (falta asignadoA, retiredReason, etc.) |
| 500 | Error inesperado |

Respuesta de error estándar:
```
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Estado ASIGNADO requiere asignadoA",
    "details": { "field": "asignadoA" }
  }
}
```

---
## 8. Migración / Base de Datos (Esquema ejemplo Prisma)
```prisma
model ITAsset {
  id            Int       @id @default(autoincrement())
  assetTag      String    @unique
  serialNumber  String?   @unique
  nombre        String
  categoria     String
  ubicacion     String
  estado        String    // EN_STOCK | ASIGNADO | EN_REPARACION | RETIRADO
  asignadoA     String?
  proveedor     String?
  fechaCompra   DateTime?
  garantiaHasta DateTime?
  notas         String?
  retiredReason String?
  movements     ITMovement[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model ITMovement {
  id        Int      @id @default(autoincrement())
  asset     ITAsset  @relation(fields: [assetId], references: [id])
  assetId   Int
  tipo      String   // ALTA | ASIGNACION | DEVOLUCION | REPARACION | BAJA | CAMBIO_UBICACION | ACTUALIZACION
  fecha     DateTime @default(now())
  detalle   String
  usuario   String
  metadata  Json?
}
```
Indices recomendados: `@@index([estado])`, `@@index([categoria])`, `@@index([assetTag])`, `@@index([fechaCompra])`, `ITMovement @@index([tipo, fecha])`.

---
## 9. KPIs y Métricas Adicionales
- Rotación promedio (tiempo entre ASIGNACION y DEVOLUCION).
- Tiempo promedio en reparación.
- % activos asignados vs total.
- Activos próximos a fin de garantía (<= 60 días).

Endpoint opcional `/api/it-assets/analytics?range=30d`.

---
## 10. Integraciones Futuras
| Integración | Uso |
|-------------|-----|
| Tickets / Helpdesk | Vincular movimientos REPARACION con IDs de ticket. |
| Directory / LDAP | Validar existencia de usuario en asignaciones. |
| CMDB | Sincronizar servidores y equipamiento crítico. |
| Licenciamiento | Verificar consumo de seats vs licencias disponibles. |

---
## 11. Estrategia de Auditoría
- Registrar usuario y IP/origen en cada movimiento.
- Guardar hash de movimiento opcional para detectar alteraciones (integridad).
- Reporte exportable (CSV/JSON) para auditorías externas.

---
## 12. Pensando en GraphQL (Opcional)
Ejemplo rápido de tipos:
```graphql
type ITAsset { id: ID! assetTag: String! nombre: String! categoria: String! ubicacion: String! estado: String! asignadoA: String proveedor: String fechaCompra: String garantiaHasta: String notas: String retiredReason: String movements: [ITMovement!]! createdAt: String! updatedAt: String! }

type ITMovement { id: ID! assetId: ID! tipo: String! fecha: String! detalle: String! usuario: String! metadata: JSON }
```

---
## 13. Seguridad
- Sanitizar texto libre (`detalle`, `notas`).
- Limitar tamaño de `notas` (ej. 2000 chars) y `detalle` (500 chars).
- Rate limit en endpoints de cambios de estado.
- Logs estructurados (assetId, tipo, usuario) para correlación.

---
## 14. Checklist Implementación Backend
1. Modelo y migraciones (Prisma).  
2. Seed opcional (activos demo).  
3. Servicio ITAssetService (CRUD + validaciones).  
4. Servicio ITMovementService (append-only).  
5. Controlador REST con endpoints descritos.  
6. Guards/RBAC para roles.  
7. Tests unitarios (estado, validaciones).  
8. Tests e2e (ciclo completo alta→asignación→reparación→devolución→retiro).  
9. Endpoint KPIs y caching ligero (TTL 30s).  
10. Monitoreo y logs (p.ej. nivel info en movimientos).  

---
## 15. Ejemplos de Flujos
### Alta y asignación
1. POST /api/it-assets (estado EN_STOCK) → movimiento ALTA.  
2. POST /api/it-assets/{id}/state (ASIGNADO + asignadoA) → movimiento ASIGNACION.  

### Reparación
1. POST /api/it-assets/{id}/state (EN_REPARACION) → movimiento REPARACION.  
2. POST /api/it-assets/{id}/state (EN_STOCK) → movimiento DEVOLUCION.  

### Retiro
1. POST /api/it-assets/{id}/state (RETIRADO + retiredReason).  

---
## 16. Frontend → Backend Integración Esperada
El mock actual consume funciones in-memory. La versión real deberá sustituir:
- `listAssets` → GET /api/it-assets
- `createAsset` → POST /api/it-assets
- `changeStatus` → POST /api/it-assets/{id}/state
- `listMovements` → GET /api/it-assets/{id}/movements

Opcional: endpoints de ubicación y movimientos globales se integrarán luego.

---
## 17. Campos futuros (extensibilidad)
- `depreciationRate`, `residualValue`, `costCenter`, `assetOwnerArea`.  
- `licenseSeats`, `licenseExpiry`, `licenseKey` para categoría Licencia.  
- Integración con control de stock periféricos (cantidad disponible).  

---
## 18. Ejemplo de Respuesta Completa ITAsset
```
{
  "id": 42,
  "assetTag": "IT-NTB-0042",
  "serialNumber": "SN-XYZ-0042",
  "nombre": "HP EliteBook 840 G10",
  "categoria": "Laptop",
  "ubicacion": "Bodega IT",
  "estado": "EN_STOCK",
  "asignadoA": null,
  "proveedor": "HP",
  "fechaCompra": "2025-03-02T00:00:00.000Z",
  "garantiaHasta": "2028-03-02T00:00:00.000Z",
  "notas": "Preparada para imaging",
  "retiredReason": null,
  "createdAt": "2025-03-02T09:15:10.000Z",
  "updatedAt": "2025-03-02T09:15:10.000Z"
}
```

---
## 19. Testing: Casos Clave
- Crear activo sin assetTag → 422.
- Cambiar estado a ASIGNADO sin asignadoA → 422.
- Retirar activo sin retiredReason → 422.
- Reasignar sin DEVOLUCION previa (si política estricta) → 409.
- Movimientos se incrementan inmutablemente.

---
## 20. Conclusión
Este estándar asegura trazabilidad, control y escalabilidad del inventario IT. Ajustar detalles según políticas internas (nomenclatura assetTag, restricciones de ciclo, roles). El frontend mock se migrará a llamadas reales reemplazando el servicio in-memory.

---
**Fin del documento**
