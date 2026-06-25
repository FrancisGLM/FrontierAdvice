# Workflow n8n: Cálculo de Ruta Más Corta A→B→C (Haversine)

## Descripción

El workflow recibe coordenadas del **Punto A** (origen) y **Punto C** (destino), y usando un registro interno de **Puntos B** (pasos fronterizos), calcula la distancia total `A→B + B→C` para cada paso fronterizo usando la fórmula de Haversine. Finalmente retorna el punto fronterizo que minimiza la distancia total.

---

## Propuesta de Nodos del Workflow

```
[Webhook Trigger] → [Set Variables A & C] → [Get All Border Points B] → [Loop / Split in Batches]
    → [Calculate Haversine A→B] → [Calculate Haversine B→C] → [Sum Total Distance]
    → [Aggregate Results] → [Find Minimum Distance] → [Respond to Webhook]
```

---

## Detalle de cada Nodo

### 1. `Webhook Trigger` — Entrada
- **Método**: POST
- **Body esperado (JSON)**:
```json
{
  "puntoA": { "lat": -33.45, "lon": -70.66 },
  "puntoC": { "lat": -22.90, "lon": -43.17 }
}
```

---

### 2. `Set` — Guardar A y C en variables globales
- Extrae `puntoA.lat`, `puntoA.lon`, `puntoC.lat`, `puntoC.lon` del body del webhook.
- Los guarda como variables reutilizables para los nodos posteriores.

---

### 3. `Code` — Registro de Puntos B (Pasos Fronterizos)
- Lista hardcodeada de puntos fronterizos (o puede conectarse a una base de datos / Google Sheets / HTTP Request).
- Genera un item por cada punto B para ser procesado en paralelo.

**Ejemplo de estructura**:
```json
[
  { "nombre": "Paso Los Libertadores", "lat": -32.82, "lon": -70.09 },
  { "nombre": "Paso Jama", "lat": -23.25, "lon": -67.06 },
  { "nombre": "Paso Pino Hachado", "lat": -38.65, "lon": -70.88 }
]
```

---

### 4. `Code` — Calcular Haversine y Distancia Total por cada B
- Itera sobre cada punto B, ya con acceso a A y C.
- Implementa la **fórmula de Haversine** para calcular:
  - `distAB` = distancia entre A y B (km)
  - `distBC` = distancia entre B y C (km)
  - `totalDist` = `distAB + distBC`

**Código JavaScript (Haversine)**:
```javascript
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}
```

---

### 5. `Code` — Encontrar la Distancia Mínima
- Agrega todos los resultados y encuentra el punto B con menor `totalDist`.
- Ordena el array por `totalDist` ascendente y toma el primero.

---

### 6. `Respond to Webhook` — Respuesta
- Retorna JSON con el resultado:
```json
{
  "mejorPaso": "Paso Los Libertadores",
  "lat": -32.82,
  "lon": -70.09,
  "distanciaA_B_km": 123.45,
  "distanciaB_C_km": 2345.67,
  "distanciaTotal_km": 2469.12,
  "todosLosPasos": [...]
}
```

---

## Opciones de Origen de los Puntos B

| Opción | Descripción | Ventaja |
|--------|-------------|---------|
| **Code node (hardcoded)** | Lista fija en el workflow | Simple, sin dependencias externas |
| **Google Sheets** | Hoja de cálculo con los pasos | Fácil de actualizar sin tocar el workflow |
| **HTTP Request** | API externa / endpoint propio | Más dinámico, escalable |
| **n8n Airtable/Notion** | Base de datos integrada | Interfaz visual para gestionar datos |

> [!IMPORTANT]
> ¿Cómo quieres gestionar el registro de puntos B (pasos fronterizos)? Las opciones más simples son **hardcoded** o **Google Sheets**.

---

## Open Questions

> [!IMPORTANT]
> **¿Cuántos puntos B** aproximadamente se van a registrar? (¿5-20 pasos o cientos?)

> [!IMPORTANT]
> **¿Dónde vivirán los puntos B?** ¿Hardcodeados en el workflow, Google Sheets, base de datos propia?

> [!NOTE]
> ¿El webhook se consumirá desde el frontend TypeScript que tienes abierto (`useCalcularRuta.ts`)? Si es así, podemos ajustar el contrato de la API para que coincida.

---

## Verification Plan

### Manual
- Trigger del webhook con coordenadas conocidas y verificar que el paso fronterizo retornado es geográficamente correcto.
- Validar con calculadoras Haversine online (e.g., movable-type.co.uk).

### Automatizado
- Script de prueba que llame al webhook y verifique que `distanciaTotal_km` del mejor paso es menor o igual al de todos los demás pasos en la respuesta.
