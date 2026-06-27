'use client';

import { N8N_WEBHOOK_URL } from '@/lib/config';
import { useState, useCallback } from 'react';
import type { OrsResponse, N8nDobleRutaResponse, N8nMensaje } from '@/lib/types';

export type Pais = 'Argentina' | 'Bolivia' | 'Chile' | 'Peru';
export type TipoVehiculo = 'coche' | 'camion';
export type SubtipoCamion =
  | 'autobus'
  | 'agricola'
  | 'forestal'
  | 'reparto'
  | 'mercancia';

export interface DireccionEstructurada {
  calle: string;
  numero: string;
  comuna: string;
  ciudad: string;
}

export interface RutaParams {
  origen: DireccionEstructurada;
  paisOrigen: Pais;
  destino: DireccionEstructurada;
  paisDestino: Pais;
  tipoVehiculo: TipoVehiculo;
  subtipoCamion?: SubtipoCamion;
}

function concatenarDireccion(d: DireccionEstructurada): string {
  const parts = [
    d.calle.trim(),
    d.numero.trim(),
    d.comuna.trim(),
    d.ciudad.trim(),
  ].filter(Boolean);
  // Formato: "Calle Número, Comuna, Ciudad"
  if (parts.length === 0) return '';
  const calleNum = [parts[0], parts[1]].filter(Boolean).join(' ');
  const resto = parts.slice(2).join(', ');
  return [calleNum, resto].filter(Boolean).join(', ');
}

interface UseCalcularRutaReturn {
  calcular: (params: RutaParams) => Promise<void>;
  limpiar: () => void;
  loading: boolean;
  error: string | null;
  resultado: N8nDobleRutaResponse | null;
}

export function useCalcularRuta(): UseCalcularRutaReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<N8nDobleRutaResponse | null>(null);

  const calcular = useCallback(async (params: RutaParams) => {
    setLoading(true);
    setError(null);
    setResultado(null);

    const webhookUrl = `${N8N_WEBHOOK_URL}/calcular-ruta`;

    // Construir payload: concatenar campos estructurados de dirección
    const origenStr = concatenarDireccion(params.origen);
    const destinoStr = concatenarDireccion(params.destino);

    const payload = {
      origen: origenStr,
      destino: destinoStr,
      paisDestino: params.paisDestino,
      tipoVehiculo: params.tipoVehiculo,
      subtipoCamion: params.tipoVehiculo === 'camion' ? params.subtipoCamion : undefined,
    };

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
          `El servidor respondió con ${res.status}${text ? `: ${text}` : ''}`
        );
      }

      // ── Leer respuesta como texto para máxima visibilidad en errores ─────────
      const rawText = await res.text();

      if (!rawText || rawText.trim().length === 0) {
        throw new Error(
          '[Debug] n8n devolvió una respuesta vacía (sin body). ' +
          'Verifica que el nodo "Respond to Webhook" en n8n está configurado correctamente.'
        );
      }

      // ── Parsear el JSON ───────────────────────────────────────────────────────
      let root: unknown;
      try {
        root = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error(
          `[Debug] La respuesta de n8n no es JSON válido.\n` +
          `Primeros 200 chars del body: ${rawText.slice(0, 200)}`
        );
      }

      // ── Comprobar si hubo un error directo del Agente ─────────────────────────
      if (typeof root === 'object' && root !== null && !Array.isArray(root)) {
        const obj = root as Record<string, unknown>;
        if (typeof obj.error === 'string' && obj.error.trim().length > 0) {
          throw new Error(obj.error);
        }
      }

      // ── Extraer el array de rutas ─────────────────────────────────────────────
      // Esperamos que el nodo Code de n8n envíe routeResult (JSON string del array)
      let parsedArray: unknown[] | null = null;

      // Caso A: viene como string de array (formato del nodo Code: routeResult)
      if (typeof root === 'string') {
        try {
          const inner = JSON.parse(root);
          if (Array.isArray(inner)) parsedArray = inner;
        } catch { /* no es JSON */ }
      }

      // Caso B: es directamente un array [mensaje, geo1, geo2]
      if (!parsedArray && Array.isArray(root) && root.length >= 3) {
        parsedArray = root;
      }

      // Caso C: el nodo Code devolvió { routeResult: "[...]" } (string serializado)
      if (!parsedArray && typeof root === 'object' && root !== null) {
        const obj = root as Record<string, unknown>;
        if (typeof obj['routeResult'] === 'string') {
          try {
            const inner = JSON.parse(obj['routeResult'] as string);
            if (Array.isArray(inner)) parsedArray = inner;
          } catch { /* noop */ }
        }
        // Caso D: { data: [...] } u otros wrappers comunes
        if (!parsedArray && Array.isArray(obj['data'])) parsedArray = obj['data'] as unknown[];
        if (!parsedArray && Array.isArray(obj['body'])) parsedArray = obj['body'] as unknown[];
        if (!parsedArray && Array.isArray(obj['items'])) parsedArray = obj['items'] as unknown[];
      }

      // Caso E: array anidado [ [msg, geo1, geo2] ]
      if (!parsedArray && Array.isArray(root) && root.length === 1 && Array.isArray(root[0])) {
        parsedArray = root[0] as unknown[];
      }

      // Caso F: Array de 1 elemento con routeResult [ { routeResult: "[...]" } ]
      if (!parsedArray && Array.isArray(root) && root.length === 1 && typeof root[0] === 'object' && root[0] !== null) {
        const obj = root[0] as Record<string, unknown>;
        if (typeof obj['routeResult'] === 'string') {
          try {
            const inner = JSON.parse(obj['routeResult'] as string);
            if (Array.isArray(inner)) parsedArray = inner;
          } catch { /* noop */ }
        }
      }

      // ── Si no pudimos extraer el array, dar error detallado ──────────────────
      if (!parsedArray || parsedArray.length < 3) {
        const rootType = Array.isArray(root) ? `Array[${(root as unknown[]).length}]` : typeof root;
        const rootKeys = typeof root === 'object' && root !== null ? `Claves: [${Object.keys(root as object).join(', ')}]` : '';
        const rootSnip = rawText.slice(0, 300);
        throw new Error(
          `[Debug] No se pudo extraer el array de rutas de la respuesta de n8n.\n` +
          `• Tipo recibido: ${rootType}. ${rootKeys}\n` +
          `• Items en array: ${parsedArray ? parsedArray.length : 'N/A'} (se necesitan 3)\n` +
          `• Raw body (primeros 300 chars):\n${rootSnip}\n\n` +
          `💡 Solución: Agrega el nodo Code "n8n_code_node_doble_ruta.js" antes del "Respond to Webhook".`
        );
      }

      // ── Validar y aplicar los 3 elementos ────────────────────────────────────
      const mensajeRaw = parsedArray[0] as N8nMensaje;
      const primaria = parsedArray[1] as OrsResponse;
      const alternativa = parsedArray[2] as OrsResponse;

      if (primaria?.type !== 'FeatureCollection' || !Array.isArray(primaria.features) || primaria.features.length === 0) {
        throw new Error(
          `[Debug] La ruta primaria (item[1]) no es un FeatureCollection válido.\n` +
          `• type: "${primaria?.type}" (esperado: "FeatureCollection")\n` +
          `• features: ${Array.isArray(primaria?.features) ? primaria.features.length : 'no es array'}`
        );
      }
      if (alternativa?.type !== 'FeatureCollection' || !Array.isArray(alternativa.features) || alternativa.features.length === 0) {
        throw new Error(
          `[Debug] La ruta alternativa (item[2]) no es un FeatureCollection válido.\n` +
          `• type: "${alternativa?.type}" (esperado: "FeatureCollection")\n` +
          `• features: ${Array.isArray(alternativa?.features) ? alternativa.features.length : 'no es array'}`
        );
      }

      setResultado({
        mensaje: mensajeRaw,
        rutaPrimaria: primaria,
        rutaAlternativa: alternativa,
        origenStr,
        destinoStr,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error desconocido al conectar con el servidor.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const limpiar = useCallback(() => {
    setResultado(null);
    setError(null);
  }, []);

  return { calcular, limpiar, loading, error, resultado };
}
