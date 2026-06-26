# Reporte de Integración: GeoJSON & OpenRouteService (ORS)

Este documento detalla la arquitectura actual y las conexiones relacionadas con el manejo de rutas, generación de GeoJSON y la integración con la API de OpenRouteService (ORS) dentro del proyecto `FrontierAdvice`. El objetivo es contextualizar rápidamente a otra IA o desarrollador sobre el flujo de datos y las tecnologías utilizadas.

## Arquitectura General del Flujo de Rutas

El flujo desde que el usuario solicita una ruta hasta que se pinta en el mapa es el siguiente:

1. **Frontend (React/Next.js)**: El componente `useCalcularRuta.ts` toma los inputs del usuario (origen, destino, tipo de vehículo) y hace una petición `POST` a un endpoint interno (`/api/calcular-ruta`).
2. **Next.js API Route (Proxy)**: Reenvía la petición al webhook de **n8n** (servidor backend de automatización) para evitar problemas de CORS.
3. **Backend (n8n Workflow)**: 
   - El workflow `ORS route no_agentic.json` procesa la lógica pesada.
   - **Fase 1 (Pre-filtro Geodésico)**: Calcula las distancias en línea recta (Haversine/Vincenty) desde el origen hasta los diferentes pasos fronterizos y desde ahí al destino. Selecciona los 3 mejores (Top 3).
   - **Fase 2 (ORS Matrix API)**: Llama a la API `Matrix` de ORS para obtener distancias y tiempos reales por ruta (usando el perfil `driving-car` o `driving-hgv` dependiendo del vehículo).
   - **Fase 3 (Scoring)**: Evalúa los resultados reales ponderando distancia, tiempo e IDR, selecciona un único paso óptimo.
   - **Llamada Final a ORS (Directions API)**: Llama a `directions` de ORS pasando como `waypoints` el [Origen, Paso Óptimo, Destino] y devuelve un GeoJSON de tipo `FeatureCollection`.
4. **Frontend (Renderizado)**: El componente `MapView.tsx` usando **Leaflet** toma ese `FeatureCollection` (GeoJSON) y lo pinta sobre el mapa.

---

## Puntos Clave de Integración

### 1. Backend (n8n & ORS)
- **Archivos/Nodos relevantes**: `docs/ORS route no_agentic.json`, `docs/fase1-prefiltro.js`, `docs/fase3-scoring.js`.
- **Integración con ORS**:
  - **Geocoding**: `https://api.openrouteservice.org/geocode/search` se usa para convertir direcciones a coordenadas.
  - **Matrix**: `https://api.openrouteservice.org/v2/matrix/...` se usa para evaluar costos de múltiples rutas al mismo tiempo. El payload contiene un array de `locations`, `sources` y `destinations`.
  - **Directions (Generación GeoJSON)**: `https://api.openrouteservice.org/v2/directions/.../geojson` se llama al final. Recibe un array `coordinates` y devuelve un GeoJSON puro (`FeatureCollection` con un `Feature`).

### 2. Frontend (Consumo e Interfaz)
- **Librería de Mapas**: **Leaflet** (`L.map`, `L.polyline`). No se usa Mapbox GL JS activamente para el renderizado vectorial directo en `MapView.tsx`, se renderiza vía polígonos/capas SVG nativas de Leaflet.
- **Archivo de Conexión de API**: `frontend/src/lib/hooks/useCalcularRuta.ts`.
  - Espera una respuesta de tipo `OrsResponse` (interface) que contenga un `type === 'FeatureCollection'`.
- **Archivo de Renderizado**: `frontend/src/components/MapArea/MapView.tsx` (Líneas 134-219).
  - **Conversión de coordenadas**: ORS devuelve las coordenadas como `[lng, lat]` en el GeoJSON, pero Leaflet nativamente para sus polilíneas espera `[lat, lng]`. El frontend mapea e invierte estas coordenadas explícitamente usando `feature.geometry.coordinates.map(([lng, lat]) => [lat, lng])`.
  - **Pintado de la ruta**: Dibuja 2 capas (`casing` de borde grueso blanco/oscuro y `line` de borde fino azul) para asegurar el contraste de la ruta en mapas claros/oscuros.
  - **Datos adicionales (Tooltip)**: El GeoJSON que manda ORS incluye dentro de `feature.properties.summary` la `distance` y `duration`. El frontend usa esto para pintar un pequeño tooltip dinámico sobre la ruta (Ej: *🛣 300 km · ⏱ 3h 10min*).

---

## Para Adaptar el Código a Múltiples Rutas (Contexto de Doble Ruta)

Si otra IA o desarrollador tiene que modificar esto para devolver **múltiples rutas**, los cambios clave detectados a partir de esta investigación son:

1. **En n8n (`fase3-scoring.js` y nodos siguientes)**: En vez de hacer un solo `Request Open Route API`, se debe iterar sobre las `top3_alternativas` (o al menos las 2 mejores), hacer peticiones a ORS `directions` para cada una y juntar los `features` devueltos en un único `FeatureCollection`. Es crucial agregar un atributo (ej. `properties.isOptimal = true/false`) a cada feature para diferenciarlos.
2. **En el Frontend (`MapView.tsx`)**: Se debe cambiar la lógica que actualmente asume que hay una sola ruta (`const feature = ruta.features[0]`). Se tiene que iterar sobre el array `ruta.features`, invertir las coordenadas para cada una, y asignarle un color de capa distinto evaluando la propiedad `isOptimal` agregada desde el backend.
