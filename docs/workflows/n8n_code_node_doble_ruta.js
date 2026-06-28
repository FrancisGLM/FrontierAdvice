/**
 * NODO CODE DE N8N — FrontierAdvice: Formatear respuesta de doble ruta
 *
 * INSTRUCCIONES:
 *  1. Agrega este nodo Code ANTES del nodo "Respond to Webhook"
 *  2. Configura el modo como: "Run Once for All Items"
 *  3. En el nodo "Respond to Webhook" configura:
 *     - Response Body:   {{ $json.routeResult }}
 *     - Response Headers: añadir  Content-Type: application/json
 *
 * INPUT ESPERADO: 3 items que llegan al nodo en orden:
 *   - Item 0: { "mensaje_natural": "..." }
 *   - Item 1: GeoJSON ruta primaria (FeatureCollection)
 *   - Item 2: GeoJSON ruta alternativa (FeatureCollection)
 */

const items = $input.all();

// ── Validaciones descriptivas ──────────────────────────────────────────────
if (!items || items.length === 0) {
  throw new Error('[FrontierAdvice] El nodo no recibió ningún item. Verifica las conexiones del workflow.');
}

if (items.length < 3) {
  const received = items.map((item, i) => `  Item ${i}: ${JSON.stringify(item.json).slice(0, 60)}...`).join('\n');
  throw new Error(
    `[FrontierAdvice] Se esperaban exactamente 3 items (mensaje + geo1 + geo2), ` +
    `pero se recibieron ${items.length}:\n${received}`
  );
}

// ── Extraer y validar cada item ────────────────────────────────────────────
const mensaje = items[0].json;
const rutaPrimaria = items[1].json;
const rutaAlternativa = items[2].json;

if (!mensaje.mensaje_natural) {
  throw new Error(`[FrontierAdvice] El Item 0 no tiene la clave "mensaje_natural". ` +
    `Contenido recibido: ${JSON.stringify(mensaje).slice(0, 100)}`);
}

if (rutaPrimaria.type !== 'FeatureCollection') {
  throw new Error(`[FrontierAdvice] El Item 1 (ruta primaria) no es un FeatureCollection. ` +
    `type recibido: "${rutaPrimaria.type}". Claves: ${Object.keys(rutaPrimaria).join(', ')}`);
}

if (rutaAlternativa.type !== 'FeatureCollection') {
  throw new Error(`[FrontierAdvice] El Item 2 (ruta alternativa) no es un FeatureCollection. ` +
    `type recibido: "${rutaAlternativa.type}". Claves: ${Object.keys(rutaAlternativa).join(', ')}`);
}

// ── Construir el payload como JSON string serializado ──────────────────────
// routeResult es el string JSON del array [mensaje, geo1, geo2]
// El nodo "Respond to Webhook" lo enviará tal cual como body HTTP
const routeArray = [mensaje, rutaPrimaria, rutaAlternativa];

return [
  {
    json: {
      routeResult: JSON.stringify(routeArray)
    }
  }
];
