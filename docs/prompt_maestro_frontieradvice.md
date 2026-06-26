# Prompt Maestro — FrontierAdvice: Cambios UI/UX y Lógica de Doble Ruta

## Contexto del Proyecto

Este documento es una instrucción técnica completa para un agente de IA que realizará cambios en el frontend (y adaptaciones mínimas de backend) de **FrontierAdvice**, una aplicación web de planificación de rutas internacionales Chile↔Argentina (y otros países). La app usa un stack basado en **Leaflet** para el mapa, paneles laterales en HTML/CSS/JS, y un workflow **n8n** como backend que retorna datos vía webhook.

El agente debe leer estas instrucciones en su totalidad antes de tocar cualquier línea de código, y respetar el estilo visual existente (tema oscuro, botones e iconografía ya establecidos) en todos los cambios.

---

## Estructura Actual de la Interfaz (Referencia)

La interfaz tiene tres zonas principales:

1. **Barra lateral izquierda de íconos** — columna vertical con 5 botones de navegación (iconos): Mapa, Historial, Ruta, Riesgo, Configuración. Actualmente el botón "Ruta" se posiciona de forma incorrecta y desaparece al clickear otros botones.
2. **Panel deslizante** — aparece a la derecha de la barra de íconos al clickear ciertos botones. Actualmente muestra "Estado de Pasos" como panel por defecto. Al clickear "Ruta", abre el panel "Calcular Ruta" pero sin reemplazar el anterior.
3. **Mapa Leaflet** — ocupa el resto del viewport. Actualmente dibuja una sola polilínea azul con el GeoJSON retornado por n8n.

---

## CAMBIO 1 — Barra lateral de íconos: Comportamiento del botón "Ruta"

### Problema actual
- El botón "Ruta" no está en la posición correcta dentro de la columna de íconos.
- Al hacer clic en cualquier otro botón (Historial, Riesgo, Configuración), el botón "Ruta" desaparece del DOM o se oculta visualmente.
- Solo reaparece al hacer clic en el botón "Mapa".

### Comportamiento requerido
- El botón "Ruta" debe estar **siempre visible y fijo** en la barra lateral de íconos, sin importar qué otro botón esté activo o seleccionado.
- Su posición exacta en la columna debe ser: **debajo de "Mapa" y encima de "Historial"**. El orden de arriba hacia abajo queda así: `[Mapa] → [Ruta] → [Historial] → [Riesgo] → [Configuración]`.
- El botón "Ruta" **nunca se oculta, nunca se desmonta del DOM, nunca pierde visibilidad** por ninguna acción del usuario.
- Verificar que la lógica de selección activa (estado visual `active`/`selected`) del botón "Ruta" no interfiera con los otros botones, pero que su presencia en el DOM sea permanente.

---

## CAMBIO 2 — Panel "Calcular Ruta": Reemplaza al panel activo en lugar de abrirse en paralelo

### Problema actual
- Al hacer clic en el botón "Ruta", el panel "Calcular Ruta" se abre **al lado** del panel "Estado de Pasos", sin cerrarlo. Ambos paneles coexisten simultáneamente.

### Comportamiento requerido
- Al hacer clic en el botón "Ruta", el panel activo en ese momento (cualquiera que sea: "Estado de Pasos", "Historial", etc.) debe **cerrarse/ocultarse completamente**, y el panel "Calcular Ruta" debe ocupar ese espacio.
- Igualmente, al hacer clic en otro botón (por ejemplo "Estado de Pasos"), el panel "Calcular Ruta" debe ocultarse y mostrarse el panel correspondiente.
- Solo un panel puede estar visible a la vez. El sistema de paneles es mutuamente exclusivo.

---

## CAMBIO 3 — Panel "Calcular Ruta": Reestructuración de campos de formulario

### 3.1 — Nuevo campo "País Origen"

- Agregar un campo selector **"País Origen"** entre el campo de origen (dirección) y el campo de destino (dirección).
- El diseño y comportamiento de este selector debe ser idéntico al campo "País Destino" ya existente.
- Las opciones disponibles por ahora son solo: **Chile (CL)**. El código de país debe aparecer a la izquierda del nombre, con el mismo formato visual que las opciones del selector "País Destino" existente (ej: `AR Argentina`, `BO Bolivia`). Para Chile: `CL Chile`.
- **Chile debe ser la opción seleccionada por defecto** al cargar el formulario.

### 3.2 — Reemplazar campos de texto libre "Origen" y "Destino" por campos estructurados

Eliminar los campos de texto libre actuales (un solo input para "Origen" y un solo input para "Destino") y reemplazarlos por grupos de campos estructurados.

**Para Origen**, crear los siguientes campos individuales (en este orden):
1. **Calle** — input de texto, placeholder: "Ej: Avenida O'Higgins"
2. **Número** — input de texto/número, placeholder: "Ej: 1234"
3. **Comuna** — input de texto, placeholder: "Ej: Talca"
4. **Ciudad** — input de texto, placeholder: "Ej: Talca"

**Para Destino**, crear los mismos cuatro campos individuales (en este orden):
1. **Calle** — input de texto, placeholder: "Ej: Av. Corrientes"
2. **Número** — input de texto/número, placeholder: "Ej: 3247"
3. **Comuna/Barrio** — input de texto, placeholder: "Ej: San Nicolás"
4. **Ciudad** — input de texto, placeholder: "Ej: Buenos Aires"

Cada grupo debe tener su encabezado visual claro ("ORIGEN" y "DESTINO") igual que la sección actual.

El valor que se envíe al webhook de n8n para el campo de origen debe ser la concatenación de: `"{Calle} {Número}, {Comuna}, {Ciudad}"`. Lo mismo para el destino. Esta concatenación se hace en el frontend antes de enviar, manteniendo la misma estructura de payload que el webhook ya espera.

### 3.3 — Campo "Tipo de Camión": Eliminar la opción "General"

- En el selector "Tipo de Camión" (opcional), la opción **"General" debe ser eliminada** del listado.
- La primera opción visible y seleccionada por defecto debe ser **"Autobús"** (o "Bus", según el valor actual en el código).
- Las demás opciones se mantienen: Agrícola, Forestal, Reparto, Mercancía.

---

## CAMBIO 4 — Eliminar sección "Ruta Calculada" del panel "Calcular Ruta"

- Actualmente, al recibir resultados del backend, el panel "Calcular Ruta" muestra una sección al pie del formulario llamada "Ruta Calculada" con datos de distancia y duración estimada.
- **Esta sección debe ser eliminada completamente** del panel "Calcular Ruta".
- Los resultados ya no se mostrarán dentro de este panel; en su lugar se usará el nuevo panel "Resultados de Ruta" (ver Cambio 5).

---

## CAMBIO 5 — Nuevo panel lateral derecho: "Resultados de Ruta"

### Descripción general

Al recibir la respuesta del webhook n8n y dibujar las rutas en el mapa (ver Cambio 7), se debe abrir automáticamente un **nuevo panel lateral** a la derecha del mapa (o en la misma zona donde se abren los paneles informativos tipo "Información del Paso"), titulado **"Resultados de Ruta"**.

Tomar como referencia visual y de posicionamiento el panel "Información del Paso" ya existente en la app.

### 5.1 — Estructura del panel (de arriba hacia abajo)

**A) Título del panel**
- Encabezado: `Resultados de Ruta`

**B) Mensaje natural**
- Un bloque de texto que muestra el contenido de `response[0].mensaje_natural` retornado por n8n.
- Este mensaje es fijo: **no cambia** al enfocar la ruta alternativa ni la primaria.
- Estilo: texto justificado o con buen interlineado, ligeramente diferenciado del fondo (ej: en un card o caja con fondo ligeramente distinto).

**C) Widgets de datos dinámicos de ruta**

Mostrar tres widgets/cards de información. Estos widgets cambian dinámicamente según qué ruta esté "enfocada" (primaria o alternativa). Por defecto muestran los datos de la **ruta primaria**.

- **Widget 1 — Distancia**
  - Ícono representativo de distancia/carretera.
  - Etiqueta: "Distancia"
  - Valor dinámico: distancia en km, redondeada a 1 decimal. Extraer del GeoJSON primario: `response[1].features[0].properties.summary.distance / 1000` km. Para la alternativa: `response[2].features[0].properties.summary.distance / 1000` km.

- **Widget 2 — Tiempo estimado**
  - Ícono representativo de tiempo/reloj.
  - Etiqueta: "Tiempo estimado"
  - Valor dinámico: duración formateada como `X h Y min`. Extraer del GeoJSON: `response[1].features[0].properties.summary.duration` en segundos, convertir a horas y minutos. Para la alternativa: ídem desde `response[2]`.

- **Widget 3 — Paso fronterizo utilizado**
  - Ícono representativo de frontera/barrera.
  - Etiqueta: "Paso Fronterizo"
  - Valor dinámico: nombre del paso fronterizo. Extraer del `mensaje_natural` parseando el texto, **o idealmente** que el backend envíe este dato como campo explícito (ver nota al final). Por ahora, usar una extracción de texto heurística, o mostrar "—" si no se puede determinar.
  - **Botón secundario** dentro de este widget: `"Ver información del paso"`. Al clickearlo, debe navegar/abrir el panel "Información del Paso" correspondiente al paso fronterizo de la ruta actualmente enfocada (primaria o alternativa), si existe en el listado de pasos.

**D) Botón de enfoque de ruta**

Un botón prominent (ancho completo o casi) ubicado debajo de los widgets:
- Estado inicial (ruta primaria enfocada): texto `"Enfocar ruta alternativa"`
- Al clickear: cambia el texto a `"Enfocar ruta primaria"`, y alterna el estado activo al revés.
- El botón **loopea**: cada clic alterna entre los dos estados indefinidamente.
- Al cambiar de estado, los widgets C actualizan sus valores para reflejar la ruta correspondiente, y los colores de las dos polilíneas en el mapa se intercambian (ver Cambio 7).

**E) Botón "Limpiar Ruta"**

- Al fondo del panel, como último elemento visible (puede ser necesario scroll si el panel es largo), un botón **"Limpiar Ruta"**.
- Al clickearlo:
  1. Elimina ambas polilíneas dibujadas en el mapa (ruta primaria y alternativa).
  2. Cierra/oculta el panel "Resultados de Ruta".
  3. Resetea el estado de enfoque a "ruta primaria".
  4. En el panel "Calcular Ruta", el botón que dice "Revisualizar Ruta" vuelve a decir "Calcular Ruta" (ver Cambio 6).
  5. El formulario "Calcular Ruta" no se limpia automáticamente; los campos mantienen sus valores.

---

## CAMBIO 6 — Botón "Calcular Ruta" → "Revisualizar Ruta" (comportamiento dinámico)

### Estado por defecto
- El botón al pie del formulario dice **"Calcular Ruta"**.
- Al clickearlo, el frontend toma los datos del formulario, construye el payload (concatenando los campos estructurados de dirección), y dispara la petición al webhook n8n. Durante la espera, mostrar estado de carga (spinner o texto "Calculando…").

### Estado post-resultado
- Una vez que se dibujan las rutas en el mapa y se abre el panel "Resultados de Ruta", el botón **cambia su texto a "Revisualizar Ruta"**.
- Al clickear "Revisualizar Ruta":
  - **No se vuelve a llamar al webhook n8n**.
  - Simplemente re-abre el panel "Resultados de Ruta" (si estaba cerrado) y re-dibuja las polilíneas en el mapa si fueron limpiadas.
  - Esto permite al usuario volver a ver los resultados sin recalcular.

### Reset
- Al hacer clic en "Limpiar Ruta" (en el panel "Resultados de Ruta"), el botón vuelve a decir "Calcular Ruta".
- Si el usuario modifica cualquier campo del formulario después de haber calculado, el botón también debe volver a "Calcular Ruta" para indicar que los resultados actuales ya no corresponden a los datos del formulario.

---

## CAMBIO 7 — Dibujar dos rutas en el mapa con Leaflet

### Estructura del payload retornado por n8n (nueva estructura — DobleRuta)

El webhook ahora retorna un array JSON de 3 elementos:

```json
[
  { "mensaje_natural": "..." },
  { "type": "FeatureCollection", "features": [...] },   // Ruta primaria (GeoJSON)
  { "type": "FeatureCollection", "features": [...] }    // Ruta alternativa (GeoJSON)
]
```

El frontend debe adaptarse para manejar este array:
- `response[0]` → objeto con `mensaje_natural` (string)
- `response[1]` → GeoJSON FeatureCollection de la **ruta primaria**
- `response[2]` → GeoJSON FeatureCollection de la **ruta alternativa**

### Dibujo de polilíneas

- **Ruta primaria**: dibujar con Leaflet usando el mismo color azul ya utilizado actualmente (ej: `#4A90D9` o el hex exacto que ya usa el código).
- **Ruta alternativa**: dibujar con un azul más opaco/desaturado (ej: `#4A90D9` con opacidad 0.4, o un tono más grisáceo como `#7BA7C9`). La diferencia debe ser clara visualmente pero manteniendo coherencia estética.
- Ambas polilíneas deben coexistir en el mapa simultáneamente.
- Al terminar de dibujar, el mapa debe hacer `fitBounds` para encuadrar **ambas** rutas en el viewport.

### Intercambio de colores (función de enfoque)

Cuando el usuario haga clic en "Enfocar ruta alternativa" (o "Enfocar ruta primaria"):
- Las polilíneas **intercambian sus estilos de color**: la que tenía el azul brillante pasa al azul opaco, y viceversa.
- Esto es visual únicamente: no cambia cuál es "primaria" o "alternativa" en los datos, solo qué color tienen.
- El estado de color se trackea en una variable booleana `alternativeIsFocused` (o equivalente).

### Limpieza de polilíneas

- Al llamar a "Limpiar Ruta", ambas polilíneas se remueven del mapa (`layer.remove()` o `map.removeLayer()`).
- Las referencias a las capas deben guardarse en variables accesibles para poder eliminarlas.

---

## CAMBIO 8 — Widgets dinámicos del panel "Resultados de Ruta": comportamiento de alternancia

Cuando el usuario hace clic en "Enfocar ruta alternativa":
1. Los widgets de **Distancia**, **Tiempo estimado** y **Paso Fronterizo** actualizan sus valores con los datos de `response[2]` (ruta alternativa).
2. Los colores de las polilíneas en el mapa se intercambian.
3. El texto del botón cambia a "Enfocar ruta primaria".

Cuando hace clic en "Enfocar ruta primaria":
1. Los widgets vuelven a mostrar los valores de `response[1]` (ruta primaria).
2. Los colores de las polilíneas se revierten.
3. El texto del botón cambia a "Enfocar ruta alternativa".

El `mensaje_natural` **no cambia** en ninguno de los dos estados.

---

## Notas técnicas adicionales

### Extracción de datos de los GeoJSON

Para obtener distancia y duración de cada ruta desde el GeoJSON ORS, usar la propiedad `summary` en el primer segmento de `features[0].properties.segments`:

```js
// Distancia en km
const distanciaKm = (geojson.features[0].properties.summary.distance / 1000).toFixed(1);

// Duración en horas y minutos
const segundos = geojson.features[0].properties.summary.duration;
const horas = Math.floor(segundos / 3600);
const minutos = Math.floor((segundos % 3600) / 60);
const tiempoFormateado = `${horas} h ${minutos} min`;
```

> **Nota:** si `properties.summary` no existe directamente en el nivel `features[0]`, revisar si está dentro de `properties.segments[0]` (que es lo que muestra el archivo de ejemplo adjunto). Adaptar el acceso según la estructura real del GeoJSON que retorna el ORS.

### Paso fronterizo

Idealmente, solicitar al equipo de n8n que el workflow agregue al array de respuesta un campo explícito con el nombre del paso fronterizo para la ruta primaria y para la alternativa, en lugar de parsear el `mensaje_natural`. Ejemplo sugerido de estructura enriquecida:

```json
[
  {
    "mensaje_natural": "...",
    "paso_primario": "Complejo Fronterizo Pehuenche",
    "paso_alternativo": "Complejo Fronterizo Vergara"
  },
  { ...GeoJSON primario... },
  { ...GeoJSON alternativo... }
]
```

Si este cambio no está disponible aún, el frontend puede extraer el nombre del paso parseando el `mensaje_natural` con una expresión regular o búsqueda de texto (ej: buscar el patrón `"a través del Complejo Fronterizo (\w+)"`).

### Preservar estilos existentes

- No alterar el esquema de colores del tema oscuro.
- No cambiar tipografía, íconos Lucide/SVG ya usados, ni el layout general del mapa.
- Los nuevos elementos (widgets, botones, inputs) deben seguir el mismo design system visual ya establecido.
- El botón "Enfocar ruta alternativa/primaria" puede usar el estilo de botón secundario ya existente en la app.
- El botón "Limpiar Ruta" (ahora en el panel de resultados) puede mantener su estilo actual (botón ghost/outline o destructivo si corresponde).

### Compatibilidad con la estructura de paneles actual

- El sistema de paneles ya tiene una lógica de apertura/cierre. El nuevo panel "Resultados de Ruta" debe integrarse en ese mismo sistema, no ser un overlay independiente.
- Si el sistema usa un componente reutilizable de panel, instanciar "Resultados de Ruta" con ese mismo componente.
- El panel "Resultados de Ruta" se abre automáticamente como efecto secundario de recibir la respuesta del webhook, no por clic de un botón de navegación lateral.

---

## Resumen de cambios (checklist para el agente)

- [ ] **C1** — Botón "Ruta" siempre visible, posición fija entre "Mapa" e "Historial"
- [ ] **C2** — Panel "Calcular Ruta" reemplaza al panel activo (sistema de paneles exclusivo)
- [ ] **C3a** — Nuevo campo selector "País Origen" con opción CL Chile por defecto
- [ ] **C3b** — Campos de dirección estructurados para Origen (Calle, Número, Comuna, Ciudad) y Destino (ídem), concatenados en el payload
- [ ] **C3c** — Eliminar opción "General" del selector Tipo de Camión; Autobús como primer valor por defecto
- [ ] **C4** — Eliminar sección "Ruta Calculada" del panel "Calcular Ruta"
- [ ] **C5** — Nuevo panel "Resultados de Ruta" con: mensaje natural, widgets dinámicos (distancia, tiempo, paso fronterizo + botón), botón toggle enfoque, botón "Limpiar Ruta" al fondo
- [ ] **C6** — Botón "Calcular Ruta" cambia a "Revisualizar Ruta" post-resultado y vuelve a "Calcular Ruta" al limpiar o modificar el formulario
- [ ] **C7** — Leaflet dibuja dos polilíneas (azul brillante primaria, azul opaco alternativa), ambas con fitBounds; intercambio de colores al enfocar
- [ ] **C8** — Widgets dinámicos del panel "Resultados de Ruta" se actualizan al alternar el enfoque de ruta
