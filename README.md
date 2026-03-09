# Backoffice SIUBEN

Base de código del Backoffice de SIUBEN.

## Requisitos
- Node.js ≥ 20
- npm ≥ 9

Si ves el error `node:fs/promises ... does not provide an export named 'constants'`, estas usando una version de Node demasiado vieja (ej. `18.0.0`).

## Configuración
1. Copia el archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```
2. Ajusta la API en runtime (sin rebuild) editando:
   - `public/runtime-config.js` durante desarrollo.
   - `/runtime-config.js` en el artefacto desplegado para producción.
   - Puedes usar una sola URL (`API_BASE_URL`) o varias (`API_BASE_URLS`), por ejemplo `http://localhost:3031` y `http://192.168.20.56:3031`.
   - El archivo `public/runtime-config.js` se copia automaticamente a `build/runtime-config.js` al ejecutar `npm run build`.

Prioridad de resolución de URL:
1. `window.__APP_CONFIG__.API_BASE_URLS` (`/runtime-config.js`)
2. `window.__APP_CONFIG__.API_BASE_URL`
3. `VITE_API_BASE_URLS`
4. `VITE_API_BASE_URL`
5. Si no existe configuración, la app lanza error al hacer requests.

## Inicio rápido
```bash
npm install
npm run dev
```

## Build de producción
```bash
npm run build
```
