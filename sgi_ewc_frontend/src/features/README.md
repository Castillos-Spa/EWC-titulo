# Guía rápida de features

Este directorio contiene los módulos de la aplicación organizados por dominio. Cada feature puede usar las siguientes carpetas (solo crea las que necesites):

- `pages/`: Páginas enrutable(s) del dominio.
- `components/`: Componentes UI específicos del dominio.
- `context/`: Estado y Providers del dominio.
- `hooks/`: Hooks del dominio.

Ejemplos:
- `features/truck-assignments/` usa `pages`, `components`, `context` y `hooks`.
- `features/dashboard/` solo tiene `pages` (no requiere contexto propio).

## Buenas prácticas
- Prefiere contextos locales al feature. Mueve un contexto a `src/contexts/` solo si es transversal (ej. autenticación, idioma).
- Evita dependencias circulares entre features. Si un feature necesita utilidades, colócalas en `src/utils/` o `src/types/` si son compartidas.
- Exporta por defecto las páginas de `pages/` para facilitar el uso con `lazy(() => import(...))`.

## Cómo crear un feature nuevo
1) Crea la carpeta `src/features/mi-feature/` y las subcarpetas necesarias.
2) Implementa la página principal en `pages/` y expórtala por defecto.
3) Registra la ruta en `src/app/router.tsx`.
4) Si necesitas estado del dominio, crea `context/` + `hooks/` para exponer tu API.
