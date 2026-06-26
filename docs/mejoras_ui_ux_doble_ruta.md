# Mejoras UI/UX y Estabilización de Doble Ruta

Este documento detalla los cambios y mejoras implementadas en el frontend de FrontierAdvice posteriores a la primera implementación de la "Doble Ruta". Los cambios se centran en la experiencia del usuario (UI/UX) del panel de cálculo, el rediseño del layout de paneles del mapa, y la estabilización de la comunicación con el webhook de n8n.

## 1. Panel "Calcular Ruta" tipo Wizard (3 Pasos)
Se rediseñó por completo el componente `RutaPanel` para evitar un formulario largo y apretado. Ahora funciona como un "Wizard" dinámico de 3 pasos:
- **Paso 1: Origen.** (País y campos de dirección).
- **Paso 2: Destino.** (País y campos de dirección).
- **Paso 3: Vehículo.** (Tipo de vehículo, subtipo y resumen de la ruta).

**Mejoras específicas:**
- Barra superior de progreso visual (Step bar) con indicadores de paso completado.
- Animaciones suaves de deslizamiento lateral (Slide horizontal) al cambiar de paso.
- Botones de navegación dinámicos: "Continuar" (con validación de campos), "Volver" y "Finalizar".
- Restricción cruzada de países (si se elige Chile en origen, no se puede en destino, y viceversa).

## 2. Rediseño del Layout de Paneles en MapDashboard
Se resolvió un problema de colisión visual donde el panel "Resultados de Ruta" (derecha) y el panel "Información del Paso" (derecha) se bloqueaban mutuamente.

**Nuevo diseño:**
- **Panel Izquierdo Exclusivo:** El componente `MapDashboard` ahora usa un sistema de estado unificado `leftPanel` (`'filtros' | 'ruta' | 'resultados'`).
- Al presionar "Finalizar" en el cálculo de ruta, el formulario desaparece y **en su lugar (lado izquierdo) aparece el panel "Resultados Ruta"**.
- El lado derecho queda completamente libre para mostrar la "Información del Paso Fronterizo". Ahora el usuario puede ver la ruta a la izquierda y la info del paso a la derecha simultáneamente.
- **Transiciones:** El `ResultadosPanel.module.css` fue modificado para animar su entrada desde la izquierda (`slideInLeft`).

## 3. Botón Flotante "Revisualizar Ruta"
El botón para volver a ver los resultados fue removido de los paneles internos y convertido en un componente flotante sobre el mapa.
- Ubicación: Esquina inferior izquierda del mapa.
- Estilo: Botón tipo "pill" con efecto Glassmorphism (fondo oscuro traslúcido y borde azul claro).
- Comportamiento: Solo aparece si existe un resultado de ruta guardado en memoria y el panel izquierdo NO está mostrando resultados. Al clickearlo, abre el panel de Resultados a la izquierda.

## 4. Estabilización de la Respuesta de n8n (Parsing NDJSON)
Se detectó que la respuesta de n8n generaba errores recurrentes (`"La respuesta del servidor no tiene el formato esperado"`). El problema raíz era que el nodo "Respond to Webhook" de n8n puede enviar datos de forma irregular cuando hay múltiples items (ej: formato NDJSON/JSON Lines, o solo el último item).

**Soluciones implementadas:**
1. **Frontend (`useCalcularRuta.ts`):** Se reescribió la lógica de parseo de JSON. Ahora lee el texto crudo (`res.text()`) y es capaz de desempaquetar la respuesta si viene en formato NDJSON (línea por línea), doble stringificado, o envuelto en un wrapper tipo `{ data: [...] }`. Adicionalmente se mejoraron los mensajes de error para que muestren un snippet de 300 caracteres del `body` real, facilitando el debugging.
2. **Backend/n8n (`n8n_code_node_doble_ruta.js`):** Se creó un script que debe insertarse como Nodo "Code" en n8n justo antes de retornar el webhook. Este nodo unifica los 3 items (Mensaje, GeoJSON Primario, GeoJSON Alternativo) en un solo array formateado explícitamente (`routeResult`), garantizando que la respuesta HTTP sea 100% predecible para el frontend.

## 5. Z-Index en Polilíneas del Mapa (Focus Toggle)
Se resolvió un problema donde, al existir dos rutas (primaria y alternativa) que se solapan parcialmente, cambiar el foco hacia una u otra solo cambiaba los colores pero la línea enfocada podía quedar tapada visualmente por la otra ruta en el mapa.
- **Solución (`MapView.tsx`):** Al presionar el botón "Enfocar ruta", el efecto ahora re-ordena dinámicamente las capas de Leaflet. Se elimina (`remove()`) y se vuelve a agregar (`addTo(map)`) la ruta enfocada en último lugar, lo que la empuja a la parte superior del stack de renderizado SVG del mapa, asegurando que siempre quede por encima.
