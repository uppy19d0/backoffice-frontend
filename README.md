# Backoffice SIUBEN

Base de código del Backoffice de SIUBEN.

## Requisitos
- Node.js ≥ 18
- npm ≥ 9

## Configuración
1. Copia el archivo de variables de entorno y ajusta la URL si es necesario:
   ```bash
   cp .env.example .env
   ```
`VITE_API_BASE_URL` apunta por defecto a `https://siuben-backoffice-api.azurewebsites.net`.  
En despliegues (Vercel, etc.) crea esta misma variable en la plataforma para apuntar al host correspondiente sin cambiar código.

## Inicio rápido
```bash
npm install
npm run dev
```

## Build de producción
```bash
npm run build
```
