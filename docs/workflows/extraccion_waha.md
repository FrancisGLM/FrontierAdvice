# Workflow de Extracción: WhatsApp (WAHA) — Canal UPF

Este documento detalla el funcionamiento del workflow en n8n encargado de interceptar, parsear y estructurar los reportes operativos del canal oficial de WhatsApp de la Unidad de Pasos Fronterizos.

## 1. Arquitectura del Workflow (n8n)

El archivo `WhatsApp-Parser-UPF.json` define un flujo reactivo basado en Webhooks (Event-Driven) que procesa los mensajes entrantes a través de la integración de WAHA (WhatsApp HTTP API).

### Flujo de Ejecución:

1. **Webhook WAHA (Listener):**
   - El nodo inicial escucha peticiones `POST` entrantes desde la instancia de WAHA en la ruta configurada (`/waha-upf`). Este webhook se dispara automáticamente cada vez que entra un nuevo mensaje al dispositivo de WhatsApp enlazado.

2. **Filtro de Canal (IF Node):**
   - El sistema recibe múltiples mensajes diarios. Este nodo valida que el remitente (`payload.from`) coincida exactamente con los ID de los Canales Oficiales de la Unidad de Pasos Fronterizos (`120363410566293258@newsletter` o `120363198041682325@newsletter`).
   - Si proviene de otro chat, el flujo termina silenciosamente (No corresponde a Canal).

3. **Obtención del Directorio (GET Pasos DB):**
   - Realiza una consulta a Strapi (`/api/paso-fronterizos`) para traer el diccionario completo de pasos activos y sus nombres oficiales. Esto sirve como tabla de homologación.

4. **Motor de Parseo con Expresiones Regulares (Parser Regex WhatsApp):**
   - Es un script en JavaScript altamente especializado en la estructura visual que usa la UPF en su canal.
   - **División por bloques:** Separa el mensaje por saltos de línea y filtra solo las líneas que empiezan con el ícono diamante (`🔹`), que la UPF usa como viñeta para cada paso fronterizo.
   - **Extracción de Estado:** Usa Regex para identificar el estado mediante lectura de emojis o texto (✅ HABILITADO, ⛔ CERRADO, ⚠️ CONDICIONADO). 
   - **Homologación de Entidades:** Extrae el nombre del complejo reportado, le quita el ruido (palabras como "Complejo", "Fronterizo"), y busca la coincidencia parcial (fuzzy match) dentro del diccionario de la base de datos para mapearlo al `documentId` correcto.
   - **Extracción de Horarios y Vehículos (NUEVO):** 
     - Busca formatos de hora (ej: `08:00 a 20:00`) para registrar los horarios de apertura y cierre.
     - Lee el texto adicional para inferir si pueden pasar `autos`, `buses` o `camiones`.

5. **Split In Batches (Loop Novedades):**
   - El parser entrega un arreglo con múltiples actualizaciones (una por cada paso mencionado en el mensaje). El nodo Loop itera por cada una.

6. **Inserción de Estado (POST EstadoDiario):**
   - Envía a Strapi un nuevo registro en `estado-diarios`.
   - Vincula el ID del paso fronterizo, inyecta el `estado_general` normalizado, horarios, vehículos y el texto original que justificó el cambio. La fuente se marca como `"WhatsApp UPF"`.

7. **Registro de Trazabilidad (POST MensajeWAHA):**
   - Registra el mensaje de WhatsApp a nivel de sistema para auditoría y confirma que fue procesado exitosamente.

---

## 2. Ventajas Técnicas

- **Reacción en Tiempo Real:** Al ser basado en un Webhook, la actualización de los estados en la plataforma ocurre instantes después de que la UPF publique el mensaje, superando al sistema de Twitter (que usa polling).
- **Procesamiento Determinista:** No depende de IA costosa para extraer los datos. Utiliza reglas estrictas de Expresiones Regulares, lo que lo hace muy rápido, 100% predecible y con nulo costo por token.
