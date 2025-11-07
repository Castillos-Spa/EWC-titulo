# Módulo Inventario Taller (Mock)

Este módulo es un mock de UI para gestionar artículos de inventario del área de **Taller** (repuestos, lubricantes, consumibles). No realiza llamadas reales al backend; usa un servicio en memoria (`mockInventoryApi.ts`).

## Objetivos
- Dar al backend una referencia clara de las pantallas y flujos previstos.
- Permitir probar interacción básica (crear ítem, ajustar stock, ver movimientos) sin persistencia.
- Definir contratos de API sugeridos.

## Entidades
### InventoryItem
```ts
{
  id: number;
  sku: string;
  nombre: string;
  categoria: string;
  ubicacion: string;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string; // 'unidades' | 'kg' | 'lts'
  estado: 'ACTIVO' | 'INACTIVO';
  descripcion?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
```

### StockMovement
```ts
{
  id: number;
  itemId: number;
  tipo: 'INGRESO' | 'EGRESO' | 'AJUSTE';
  cantidad: number; // siempre positivo
  motivo: string;
  usuario: string;
  fecha: string; // ISO
  saldoPosterior: number;
}
```

## Contratos API sugeridos (REST)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/inventory/items?search=&categoria=&estado=` | Listado con filtros básicos |
| GET | `/inventory/items/:id` | Detalle de ítem |
| POST | `/inventory/items` | Crear nuevo artículo |
| PUT | `/inventory/items/:id` | Actualizar datos del artículo |
| POST | `/inventory/items/:id/adjust-stock` | Ajustar stock (ingreso/egreso) |
| GET | `/inventory/items/:id/movements` | Listar movimientos recientes |
| POST | `/inventory/items/:id/deactivate` | Marcar artículo como INACTIVO |

### Ejemplo: Crear ítem
```json
POST /inventory/items
{
  "sku": "ACE-10W40",
  "nombre": "Aceite Motor 10W40",
  "categoria": "Lubricantes",
  "ubicacion": "Bodega A1",
  "stockInicial": 38,
  "stockMinimo": 10,
  "unidadMedida": "lts",
  "descripcion": "Lubricante semi-sintético."
}
```
Respuesta:
```json
201 Created
{
  "id": 123,
  "sku": "ACE-10W40",
  "nombre": "Aceite Motor 10W40",
  "categoria": "Lubricantes",
  "ubicacion": "Bodega A1",
  "stockActual": 38,
  "stockMinimo": 10,
  "unidadMedida": "lts",
  "estado": "ACTIVO",
  "descripcion": "Lubricante semi-sintético.",
  "createdAt": "2025-11-07T10:00:00.000Z",
  "updatedAt": "2025-11-07T10:00:00.000Z"
}
```

### Ejemplo: Ajuste de stock
```json
POST /inventory/items/123/adjust-stock
{
  "cantidad": -5,
  "motivo": "Consumo en orden de trabajo 456"
}
```
Respuesta:
```json
200 OK
{
  "id": 123,
  "stockActual": 33,
  "stockMinimo": 10,
  "saldoAnterior": 38,
  "movimiento": {
    "id": 999,
    "itemId": 123,
    "tipo": "EGRESO",
    "cantidad": 5,
    "motivo": "Consumo en orden de trabajo 456",
    "usuario": "usuarioActual",
    "fecha": "2025-11-07T10:05:00.000Z",
    "saldoPosterior": 33
  }
}
```

## Consideraciones backend
- Validar que un ajuste no deje stock negativo; si ocurre, retornar 422 con detalle.
- Control de concurrencia simple vía versión (etag) opcional: header `If-Match`.
- Auditar movimientos (usuario, timestamp) para trazabilidad.
- Posible endpoint adicional para bajas lógicas masivas o clasificación.

## Extensiones futuras
- Soporte para lotes y fechas de vencimiento.
- Reportes de rotación y proyección de quiebres de stock.
- Integración con módulo de mantenimiento para consumo automático.

## Estado actual
UI lista como mock, sin persistencia. Ajustar naming si backend decide otro esquema.
