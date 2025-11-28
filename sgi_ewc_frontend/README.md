# SGI EWC Frontend

Aplicación web construida con Vite + React + TypeScript y Tailwind CSS. Usa una arquitectura por features con rutas con lazy-loading y contextos locales por dominio.

## Requisitos
- Node 18+
- pnpm 8+

## Configuración rápida
1) Copia variables de entorno:

```powershell
Copy-Item .env.example .env
```

2) Instala dependencias:

```powershell
pnpm install
```

3) Desarrollo (hot reload):

```powershell
pnpm dev
```

4) Compilación producción:

```powershell
pnpm build
pnpm preview  # opcional, servir build local
```

## Variables de entorno
- `VITE_API_URL`: URL base del backend (HTTP y Socket.IO). Ejemplo: `http://localhost:3000`.

## Estructura del proyecto (resumen)

```
src/
  app/                # Infra de app: layout, router, páginas globales
  contexts/           # Contextos transversales (Auth, Language)
  features/           # Módulos por dominio (users, auth, routes, etc.)
  types/              # Tipos compartidos (DTOs y modelos)
  utils/              # Clientes/API y utilidades compartidas
```

### Convención por feature
Cada feature puede tener estas carpetas (usa solo las que necesites):
- `pages/`: Páginas enrutable(s) del dominio
- `components/`: Componentes UI del dominio
- `context/`: Contexto/Provider local del dominio
- `hooks/`: Hooks específicos del dominio

Ejemplo:
```
src/features/truck-assignments/
  pages/TruckAssignmentPage.tsx
  components/TruckAssignmentCards.tsx
  context/TruckAssignmentContext.tsx
  hooks/useTruckAssignment.ts
```

## Rutas y lazy-loading
- Las rutas están definidas en `src/app/router.tsx`.
- Las páginas se importan con `lazy(() => import(...))` para dividir el bundle.

## Módulos y rutas

Rutas públicas:
- `/login` -> `features/auth/pages/Login` - Inicio de sesión y autenticación de usuarios.
- `/forgot-password` -> `features/auth/pages/ForgotPassword` - Recuperación de contraseña (placeholder temporal).

Rutas protegidas (dentro de MainLayout):
- `/` -> `features/dashboard/pages/DashboardHome` - Resumen ejecutivo con métricas y accesos rápidos.
- `/rutas` -> `features/transport-routes/pages/RoutesPage` - Planificación y gestión de rutas de transporte.
- `/flota` -> `features/fleet/pages/FleetPage` - Registro de vehículos y estado de la flota.
- `/combustible` -> `features/fuel/pages/FuelPage` - Control de consumo y carga de combustible por flota.
- `/mantenimiento` -> `features/maintenance/pages/MaintenancePage` - Gestión de mantenimientos preventivos y correctivos.
- `/aseo` -> `features/cleaning/pages/CleaningPage` - Reportes y seguimiento de aseo/limpieza.
- `/obras-civiles` -> `features/civil-works/pages/CivilWorksPage` - Reportes de obras civiles.
- `/incidentes` -> `features/incidents/pages/IncidentsPage` - Registro y seguimiento de incidentes.
- `/notificaciones` -> `features/notifications/pages/NotificationsPage` - Centro de notificaciones y avisos.
- `/tickets` -> `features/tickets/pages/TicketsPage` - Sistema de tickets de soporte/IT.
- `/usuarios` -> `features/users/pages/UserManagement` - Administración de usuarios y roles.
- `/perfil` -> `features/profile/pages/UserProfile` - Perfil del usuario y preferencias.
- `/ajustes` -> `features/settings/pages/SettingsPage` - Configuración general de la aplicación.
- `/truck-assignments` -> `features/truck-assignments/pages/TruckAssignmentPage` - Asignación de camiones y conductores a rutas.

Fallback:
- `*` -> `app/pages/UnderMaintenance` - Página de mantenimiento/no encontrada con opción de volver.

## Alias y TypeScript
- Alias configurados en `tsconfig.app.json`:
  - `@app/*` -> `src/app/*`
  - `@features/*` -> `src/features/*`
- TypeScript está en modo estricto.

## Estilos
- Tailwind CSS con configuración en `tailwind.config.js`.
- Soporte de tema claro/oscuro vía clase `dark` en `<html>` y script temprano en `index.html`.

## APIs
- Clientes en `src/utils/*Api.ts` (por dominio). Ejemplos: `tallerApi.ts`, `RoutesApi.ts`, `userApi.ts`.
- Manejan respuestas paginadas comunes y normalización de datos.

## Cómo agregar un nuevo feature
1) Crea subcarpetas necesarias dentro de `src/features/mi-feature/` (pages, components, etc.).
2) Implementa tu(s) página(s) en `pages/` y exporta por defecto.
3) Registra la ruta en `src/app/router.tsx` usando `lazy`.
4) Si necesitas estado de dominio, crea un context en `context/` y un hook en `hooks/`.

## Ejemplo de uso de un Provider de dominio
```tsx
import { TruckAssignmentProvider } from '@features/truck-assignments/context/TruckAssignmentContext';

export default function TruckAssignmentRoute() {
  return (
    <TruckAssignmentProvider>
      {/* children del feature */}
    </TruckAssignmentProvider>
  );
}
```

## Calidad y rendimiento
- Plugin SWC para React en `vite.config.ts` para builds rápidas.
- División de chunks (manualChunks) para vendors frecuentes.
- Linter: ESLint flat config (ver `eslint.config.js`).

## Troubleshooting
- Si el theme no aplica, revisa el script temprano en `index.html` y el valor almacenado en `localStorage['theme']`.
- Si una API falla, confirma `VITE_API_URL` en `.env` y que el backend acepte CORS.
