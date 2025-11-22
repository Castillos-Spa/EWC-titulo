# Sistema EWC — Manual Técnico

## 1. Visión General

- **Repositorio**: `EWC-titulo` organiza tres artefactos principales:
  - `backend/`: API REST + WebSocket basada en NestJS 11.
  - `sgi_ewc_frontend/`: SPA React 18 (Vite + Tailwind) para escritorio.
  - `app_movil/`: aplicación Expo Router (React Native 0.81) con capacidades offline.
- **Objetivo**: digitalizar operaciones de Castillos-Spa (rutas, flota, combustible, mantenimiento, aseo, obras civiles, incidentes, tickets y notificaciones).
- **Stack base**: Node 20+/pnpm 8, PostgreSQL + Prisma, Socket.IO para notificaciones en tiempo real, Zustand/Tailwind/Expo para UI.

## 2. Arquitectura y Dominios

```
┌──────────────┐        ┌──────────────────────┐        ┌────────────┐
│  App móvil   │◄──────►│  Backend NestJS API  │◄──────►│  Web SGI   │
│ (Expo RN)    │  REST  │  / WebSocket (api/v1)│  REST  │ (Vite)     │
└──────────────┘        └──────────────────────┘        └────────────┘
        ▲                        ▲   ▲                         ▲
        │                        │   │                         │
        │ offline + sync_queue   │   │Socket.IO                │
        ▼                        ▼   ▼                         ▼
                   PostgreSQL + Prisma (schema en `backend/prisma/schema.prisma`)
```

- Dominios alineados en las tres capas: rutas (`routes`), flota (`vehicle`), combustible (`fuel`), mantenimiento/taller (`workshop`), aseo (`cleaning`/`Aseo`), obras civiles (`civil-work`), incidentes (`incident`), tickets/QA (`ticket`/`qa`), notificaciones (`notification`), dashboard (`dashboard`) y usuarios (`users`).

## 3. Backend (`backend/`)

- **Entrada**: `src/main.ts` aplica `ValidationPipe` (whitelist, forbid unknown), `helmet`, `compression`, logging de latencia y CORS dinámico (`CORS_ORIGINS`). Prefijo global `api/v1`.
- **AppModule** (`src/app/app.module.ts`):
  - `ConfigModule` global (`.env`).
  - `ThrottlerModule` (100 req/min).
  - Guards globales `ThrottlerGuard` + `JwtAuthGuard`.
  - Importa módulos por dominio (`features/*`).
- **Autenticación** (`src/features/auth`): Passport local/JWT, `JwtModule` async (requiere `JWT_SECRET`), guards de permisos/roles/Ws (`guards/`). Tokens expiran en 15 min; los clientes refrescan automáticamente.
- **Notificaciones tiempo real** (`src/features/notification/notification.gateway.ts`): Socket.IO con salas por usuario (`user_{id}`), rol y área. Eventos emitidos: `notifications:init`, `notification`, `notifications:error`.
- **Core y datos**:
  - `CoreModule` expone `PrismaModule` y `NotificationModule` como globales.
  - `PrismaService` (`prisma/prisma.service.ts`) maneja reconexión segura y logging.
  - `PrismaExceptionFilter` traduce errores P2002/P2025 a códigos HTTP amigables.
- **Scripts pnpm** (`backend/package.json`):
  - `pnpm start:dev` (watch), `pnpm build`, `pnpm start:prod:mem` (Node con 1 GB), `pnpm test`, `pnpm test:e2e`, `pnpm seed`, `pnpm sonar`.
- **Dependencias clave**: `@nestjs/*`, `@prisma/client`, `prisma`, `passport`, `socket.io`, `helmet`, `compression`.

## 4. Modelo de Datos (PostgreSQL + Prisma)

- Definido en `backend/prisma/schema.prisma`. Entidades principales:
  - `User`, `UserRoleAssignment`, `Notification`, `UserNotification`.
  - Operaciones: `Ticket`, `TicketApproval`, `Incident`, `TransportRoute`, `TruckAssignment`, `Vehiculo`, `OrdenTrabajo`, `QA`, `Aseo`, `CivilWork`, `FuelLog`, `SolicitudCompra`, `Repuesto`.
  - Enumeraciones para roles, permisos, severidades, estados y frecuencias.
- Índices en campos intensivos (`patente`, `username`, `estado`, etc.). Relaciones con `onDelete` y arrays (`Role[]`, `Area[]`).
- Migraciones almacenadas en `backend/prisma/migrations/`; ejecutar antes de subir ambientes productivos.

## 5. Frontend Web (`sgi_ewc_frontend/`)

- **Stack**: React 18 + Vite + TypeScript estricto + Tailwind + SWC (`vite.config.ts`).
- **Estructura**:
  - `src/app/`: layout, router, páginas globales.
  - `src/features/`: módulos por dominio (dashboard, fleet, fuel, maintenance, cleaning, civil-works, incidents, notifications, tickets, users, profile, settings, inventory, it-inventory, truck-assignments).
  - `src/contexts/`, `src/utils/`, `src/types/` para lógica compartida.
- **Ruteo** (`src/app/router.tsx`):
  - Públicos: `/login`, `/forgot-password`.
  - Protegidos: `/` (dashboard) y restantes dominios; `RequireAuth` valida sesión.
  - Rutas anidadas en `/inventario-it/*` con `lazy` y `Suspense`.
- **Configuración**:
  - Variables `.env`: `VITE_API_URL` (debe incluir `/api/v1`), `VITE_DEMO_MODE`, `VITE_DEMO_API_URL` (opcional) según `README_API.md`.
- **Scripts pnpm** (`package.json`):
  ```bash
  pnpm install
  pnpm dev           # servidor Vite
  pnpm build         # build producción
  pnpm preview       # serve build
  pnpm lint          # ESLint flat
  pnpm cy:open|cy:run# Cypress e2e
  ```

## 6. Aplicación Móvil (`app_movil/`)

- **Stack**: Expo SDK 54, React Native 0.81, Expo Router, Zustand, SQLite (via `expo-sqlite`), Socket.IO client.
- **Configuración**: `app.json` define `extra.apiUrl`, permisos biométricos, notificaciones push y `newArchEnabled`.
- **Layout** (`app/_layout.tsx`):
  - Carga autenticación (`useAuthStore`) y tema (`useThemeStore`).
  - Renderiza `LoginScreen` hasta que la sesión es válida; luego habilita stack `(tabs)`.
- **Servicios** (`app/services/`):
  - `ApiClient`: resuelve `EXPO_PUBLIC_API_URL` o `extra.apiUrl`, maneja tokens en `SafeStorage`, refresh automático y timeouts.
  - `SafeStorage`: SecureStore en nativo, localStorage en web.
  - `SocketService`: maneja reconexión y normaliza hosts `localhost` → `10.0.2.2` para Android.
  - `DatabaseService`: define tablas `routes`, `stops`, `trips`, `incidents`, `fuel_records`, `tickets`, `sync_queue` y utilidades `saveIncidents`/`saveTrip`/`addToSyncQueue`.
- **Zustand stores** (`app/stores/`): auth, tema, rutas, combustible, mantenimiento, limpieza, civil works, incidentes, tickets, notificaciones, navegación, sincronización.
- **Hooks clave**: `useFrameworkReady` (avisa a integraciones web), `useAuthz` (autoriza módulos por rol/área, alineado con el web).
- **Scripts pnpm** (`package.json`):
  ```bash
  pnpm install
  pnpm dev            # expo start --clear
  pnpm run android
  pnpm run ios
  pnpm run build:web  # export web
  pnpm lint           # expo lint
  ```

## 7. Configuración de Entornos

| Componente | Archivo                 | Variables críticas                                                                |
| ---------- | ----------------------- | --------------------------------------------------------------------------------- |
| Backend    | `backend/.env`          | `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`, `PORT`, `ENABLE_MEM_LOG` (opcional) |
| Web        | `sgi_ewc_frontend/.env` | `VITE_API_URL`, `VITE_DEMO_MODE`, `VITE_DEMO_API_URL`                             |
| Móvil      | `.env` o `app.json`     | `EXPO_PUBLIC_API_URL` (o `expo.extra.apiUrl`), credenciales push                  |

**Notas**:

- `VITE_API_URL` y clientes móviles deben incluir `/api/v1` por el prefijo global.
- Android emulador requiere `10.0.2.2` para apuntar al host local; `ApiClient` y `SocketService` realizan la sustitución automáticamente.

## 8. Puesta en Marcha

1. **Clonar y preparar entorno**
   ```bash
   git clone <repo>
   cd EWC-titulo
   pnpm install --filter backend...
   pnpm install --filter sgi_ewc_frontend...
   pnpm install --filter app_movil...
   ```
2. **Configurar variables** copiando cada `.env.example` (crear si no existe) y llenando credenciales.
3. **Base de datos**:
   ```bash
   cd backend
   pnpm prisma migrate dev
   pnpm seed        # opcional
   ```
4. **Ejecución local**:
   - Backend: `pnpm start:dev`.
   - Web: `cd ../sgi_ewc_frontend && pnpm dev` (asegurar `VITE_API_URL`).
   - Móvil: `cd ../app_movil && pnpm dev` (Expo QR o simulador).

## 9. Despliegue

- **Backend**:
  - Construir: `pnpm build`.
  - Ejecutar: `pnpm start:prod:mem` (usa `node --max-old-space-size=1024 dist/main`).
  - Requerir reverse proxy HTTPS que soporte Socket.IO.
- **Web**:
  - `pnpm build` genera `dist/`; desplegar en CDN/hosting estático.
  - Ajustar `VITE_API_URL` al dominio público.
- **Móvil**:
  - Ejecutar `expo run:android` / `expo run:ios` o configurar EAS Build para binarios firmados.
  - Actualizar `app.json` (iconos, package/bundle IDs) antes de liberar.

## 10. Calidad y Pruebas

- **Backend**: `pnpm test`, `pnpm test:e2e`, `pnpm test:cov`.
- **Web**: `pnpm lint`, `pnpm cy:run` (Cypress) y pruebas unitarias si se agregan.
- **Móvil**: `pnpm lint` (expo) y pruebas manuales/offline para sincronización.
- Considerar pipeline CI (GitHub Actions) que ejecute lint + tests + builds para las tres apps antes de merge a `main`.

## 11. Operación y Monitoreo

- **Logs**: backend imprime duración por request y puede habilitar `ENABLE_MEM_LOG=1` para uso de memoria cada 30 s.
- **Seguridad**: JWT + rate limiting, `helmet`, `compression`, validación estricta; mantener secretos en almacenes seguros.
- **Sincronización móvil**: revisar la tabla `sync_queue` para identificar registros fallidos; `useSyncStore.markApiOk()` indica último contacto con backend.
- **Notificaciones**: confirmar suscripción correcta a salas (user/role/area) y que Socket.IO esté habilitado con CORS apropiado.

## 12. Problemas Comunes

| Síntoma                                | Causa probable                                | Resolución                                                                                  |
| -------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `401 Sesión expirada` en móvil         | Refresh token inválido                        | `SafeStorage.deleteItem('accessToken')` via logout; reautenticar.                           |
| Web no obtiene datos                   | `VITE_API_URL` sin `/api/v1` o CORS bloqueado | Ajustar `.env` y `CORS_ORIGINS` en backend.                                                 |
| App Android no conecta a backend local | Uso de `localhost`                            | Usar `10.0.2.2` o iniciar backend en IP LAN; `ApiClient` ya transforma si la URL es válida. |
| Socket.IO desconectado                 | Falta query `userId`/`role` o firewall WS     | Revisar `SocketService.connect` y reglas del proxy.                                         |
| `pnpm start:dev` falla por migraciones | BD sin esquema                                | Ejecutar `pnpm prisma migrate dev` antes de iniciar.                                        |

## 13. Próximos Pasos Sugeridos

1. Reemplazar `backend/README.md` genérico por documentación específica (endpoints, seed, despliegue).
2. Generar especificación OpenAPI (`@nestjs/swagger`) para compartir contratos con los clientes.
3. Automatizar CI/CD con lint + pruebas unitarias/E2E y build Expo.
4. Monitorear sincronización offline (alertas cuando `sync_queue` acumule reintentos fallidos).

---

Para dudas o mejoras, documenta cambios en este README y crea issues/pull requests dirigidos al branch `main`.
