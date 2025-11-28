Backend API URL (Vite)
----------------------

Configura la URL del backend para el frontend web con un archivo `.env` en `sgi_ewc_frontend/`.

IMPORTANTE: Debe incluir el prefijo global `api/v1` establecido en el backend (`app.setGlobalPrefix('api/v1')`).

Ejemplo local por defecto (NestJS en http://localhost:3000 con prefix `api/v1`):

VITE_API_URL=http://localhost:3000/api/v1

Modo Demo (solo frontend web)
-----------------------------

Puedes habilitar un modo demo sin tocar el backend con:

VITE_DEMO_MODE=true

Con esto, el frontend intercepta llamadas comunes y responde con datos locales simulados. Las operaciones de escritura se simulan (no persisten). Útil para demos o ambientes de venta.

Si cuentas con un backend demo dedicado, puedes apuntar directamente a él:

VITE_DEMO_MODE=true
VITE_DEMO_API_URL=https://demo.tu-backend.com/api/v1

En despliegue, usa la URL pública de tu backend (https o http según corresponda), incluyendo el prefijo si aplica. El cliente de Socket.IO derivará automáticamente el origen a partir de `VITE_API_URL`.
