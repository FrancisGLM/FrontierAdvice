/**
 * Ruta de prueba: Chile → Argentina
 * Fuente: OpenRouteService (driving-hgv / bus)
 * Distancia: ~1 528 km | Duración estimada: ~22 h 44 min
 *
 * El JSON importado es un array [OrsResponse] (estructura estándar de ORS).
 * Exportamos directamente el primer elemento para que MapView lo consuma sin
 * necesidad de desestructurarlo en cada componente.
 */

import type { OrsResponse } from '@/lib/types';
import rawData from './rutaEjemplo.json';

// ORS devuelve el resultado envuelto en un array; tomamos el primer elemento.
export const rutaCLAR: OrsResponse = (rawData as unknown as OrsResponse[])[0];
