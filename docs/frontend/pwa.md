# Progressive Web App (PWA)

FrontierAdvice implementa funcionalidad PWA mediante la librería `@ducanh2912/next-pwa`. Esto permite que los usuarios instalen la aplicación en sus dispositivos móviles y computadoras, y accedan a ella incluso cuando pierden conexión a internet (común en áreas de frontera y alta montaña).

## Configuración Principal

1. **`next.config.ts`:**
   En este archivo se envuelve la configuración de Next.js con el plugin `withPWA`. Está configurado para generar los archivos del Service Worker en la carpeta `public/` de forma automática.
   Se habilita agresivamente la caché en el frontend para asegurar que las páginas de mapas y riesgo queden almacenadas en el caché del navegador.

2. **`public/manifest.json`:**
   Define los parámetros de instalación de la aplicación, como su nombre (FrontierAdvice), la URL de inicio, color del tema y los íconos requeridos (192x192 y 512x512).

3. **`src/app/layout.tsx`:**
   La API de Metadata de Next.js se encarga de inyectar automáticamente el `manifest.json` y el `themeColor` en la cabecera del documento para que iOS, Android y Windows reconozcan la aplicación como instalable.

## ¿Cómo Funciona el Modo Offline?

El Service Worker generado por `next-pwa` utiliza **Workbox** por debajo. Este intercepta todas las peticiones de red (imágenes, scripts JS, CSS y peticiones JSON de Next.js).
Cuando un usuario ingresa a `/mapa` o `/riesgo` con conexión a internet, el Service Worker descarga y guarda los resultados en caché. Si el usuario pierde conexión, el Service Worker servirá los últimos resultados almacenados en caché inmediatamente.

> **Nota para Desarrolladores:** El Service Worker está desactivado por defecto en el modo de desarrollo (`NODE_ENV === "development"`) para evitar que el caché interfiera con los cambios en caliente (Hot Module Replacement). Se activará automáticamente al compilar con `npm run build`.
