# Synkro AI — Frontend

Aplicación web para gestionar y optimizar catálogos de productos en múltiples marketplaces usando inteligencia artificial.

## Stack tecnológico

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **shadcn/ui**
- **TanStack React Query** para fetching y caché
- **React Router DOM** para navegación

## Desarrollo local

```bash
npm install
npm run dev
```

El frontend corre en `http://localhost:8080` y conecta con el backend en `http://localhost:3001`.

## Variables de entorno

Crea un archivo `.env` en la raíz:

```
VITE_API_URL=http://localhost:3001
```

## Backend

El servidor backend se encuentra en el proyecto `synkro_ai_server`. Asegúrate de que esté corriendo antes de usar el frontend.
