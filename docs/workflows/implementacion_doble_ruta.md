# Documentación: Implementación de Doble Ruta y UI/UX

Este documento detalla los cambios realizados en el frontend de **FrontierAdvice** para soportar el nuevo flujo de "Doble Ruta" (ruta primaria y alternativa) proveniente de n8n, así como la reestructuración de la interfaz de usuario de acuerdo a los requerimientos solicitados en el *Prompt Maestro*.

## 1. Cambios a Nivel de Datos y API

### Nueva Respuesta de n8n
Anteriormente, el backend (a través del webhook de n8n) devolvía un único objeto GeoJSON de OpenRouteService (`OrsResponse`). Ahora, devuelve un array de 3 elementos:
1. `mensaje`: Un objeto con un `mensaje_natural` describiendo el análisis de las rutas, y opcionalmente los nombres de los pasos fronterizos.
2. `rutaPrimaria`: El GeoJSON principal (`OrsResponse`).
3. `rutaAlternativa`: El GeoJSON de la segunda mejor opción (`OrsResponse`).

**Archivos afectados:**
- `frontend/src/lib/types.ts`: Se añadió la interfaz `N8nDobleRutaResponse` para tipar correctamente la nueva estructura.
- `frontend/src/lib/hooks/useCalcularRuta.ts`: Se actualizó la lógica de validación y parseo de la respuesta para aceptar y procesar este array. Mantiene soporte retrocompatible por seguridad.

### Payload Estructurado
Se modificó el payload enviado al backend para separar las direcciones en campos estructurados (Calle, Número, Comuna, Ciudad) y se añadió el `paisOrigen`. Estos campos se concatenan en el frontend antes de enviarse a n8n para mantener la compatibilidad con el webhook actual.

## 2. Cambios en la Navegación (NavRail)

**Problema:** El botón "Ruta" desaparecía de la barra lateral dependiendo del historial de navegación o si se cerraba el panel.
**Solución:** Se modificó `NavRail.tsx` (Cambio 1) para sacar el botón del renderizado condicional dependiente del estado del panel. Ahora el botón está posicionado fijamente entre "Mapa" e "Historial" y siempre es visible mientras se esté en la ruta base `/mapa`.

## 3. Reestructuración de Paneles (MapDashboard)

Se implementó un sistema de **paneles izquierdos mutuamente exclusivos** (Cambio 2) en `MapDashboard.tsx`.
- Ahora existe un estado `leftPanel: 'filtros' | 'ruta'`.
- Al abrir el panel de "Ruta", se cierra automáticamente la barra lateral de filtros de pasos fronterizos, y viceversa, manteniendo la interfaz limpia.
- `MapDashboard` actúa como orquestador central, controlando qué panel izquierdo se muestra, si se debe mostrar el nuevo panel de resultados a la derecha, y qué ruta está actualmente "enfocada".

## 4. Nuevo Panel de Origen/Destino (RutaPanel)

El formulario de `RutaPanel.tsx` fue refactorizado extensivamente:
- **Campos Estructurados (Cambio 3a/b):** Se reemplazó el único input de origen/destino por 4 inputs separados (Calle, Número, Comuna, Ciudad) y un selector de País.
- **Limpieza de Opciones (Cambio 3c):** Se eliminó la opción "General" en los subtipos de camiones; la opción por defecto ahora es "Autobús".
- **Botón Dinámico (Cambio 6):** El botón de "Calcular Ruta" ahora cambia a "Revisualizar Ruta" si ya se obtuvo un resultado y no se ha modificado ningún campo. Esto permite reabrir los resultados sin hacer una nueva petición al servidor.
- **Eliminación de la Tarjeta de Resultados (Cambio 4):** Se eliminó la `summaryCard` que aparecía al final del formulario, ya que los resultados ahora tienen su propio panel.

## 5. Nuevo Panel de Resultados (ResultadosPanel)

Se creó un componente completamente nuevo: `ResultadosPanel.tsx` (Cambio 5).
- **Diseño:** Utiliza el mismo patrón visual ("slide-in" desde la derecha) que el panel de información de los pasos fronterizos (`PasoInfoPanel`).
- **Contenido:**
  - Muestra el **Mensaje Natural** devuelto por n8n en una tarjeta destacada.
  - Cuenta con **3 Widgets Dinámicos** que muestran: Distancia en km, Tiempo Estimado y el Nombre del Paso Fronterizo (extraído inteligentemente mediante heurística o del payload directo).
  - Incluye un botón para abrir la información detallada del paso fronterizo si éste hace match con la base de datos local del mapa.
- **Toggle de Enfoque (Cambio 8):** Un botón permite alternar entre "Enfocar ruta primaria" y "Enfocar ruta alternativa". Al hacer clic, los widgets se actualizan con los datos de la ruta correspondiente.
- **Limpieza (Cambio 5/E):** Un botón al fondo permite limpiar las rutas del mapa y cerrar el panel.

## 6. Renderizado del Mapa (MapView)

El componente central de Leaflet (`MapView.tsx`) fue actualizado para soportar el dibujo simultáneo y dinámico de múltiples rutas (Cambio 7).
- **Dos Polilíneas:** Ahora se dibujan ambas rutas en el mapa. La primaria con un color azul brillante (`#2563eb`) y la alternativa con un azul más opaco (`#7BA7C9`).
- **FitBounds Combinado:** Al recibir los resultados, el mapa ajusta el zoom y la posición para que ambas rutas sean visibles al mismo tiempo.
- **Intercambio de Colores:** En lugar de re-renderizar o destruir las capas cada vez que el usuario alterna el enfoque, el mapa utiliza `setStyle()` de Leaflet para simplemente intercambiar los colores de las polilíneas de forma instantánea y eficiente en rendimiento.

---
*Documentación autogenerada durante la actualización del frontend de FrontierAdvice.*
