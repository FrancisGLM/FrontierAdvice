'use client';

import { useState, useCallback } from 'react';
import type { OrsResponse, N8nDobleRutaResponse, N8nMensaje } from '@/lib/types';

export type PaisDestino = 'Argentina' | 'Bolivia' | 'Peru';
export type PaisOrigen = 'Chile';
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
  paisOrigen: PaisOrigen;
  destino: DireccionEstructurada;
  paisDestino: PaisDestino;
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

    const webhookUrl = '/api/calcular-ruta';

    // Construir payload: concatenar campos estructurados de dirección
    const origenStr = concatenarDireccion(params.origen);
    const destinoStr = concatenarDireccion(params.destino);

    const payload = {
      origen:          origenStr,
      destino:         destinoStr,
      paisDestino:     params.paisDestino,
      tipoVehiculo:    params.tipoVehiculo,
      subtipoCamion:   params.tipoVehiculo === 'camion' ? params.subtipoCamion : undefined,
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

      // n8n retorna el nuevo array: [mensaje, orsGeoJSON1, orsGeoJSON2]
      const data = await res.json();

      // Soportar tanto el array nuevo como un solo OrsResponse (retrocompatibilidad)
      if (Array.isArray(data) && data.length >= 3) {
        const mensajeRaw = data[0] as N8nMensaje;
        const primaria   = data[1] as OrsResponse;
        const alternativa = data[2] as OrsResponse;

        if (
          primaria?.type !== 'FeatureCollection' ||
          !Array.isArray(primaria.features) ||
          primaria.features.length === 0
        ) {
          throw new Error('La ruta primaria no contiene datos válidos.');
        }
        if (
          alternativa?.type !== 'FeatureCollection' ||
          !Array.isArray(alternativa.features) ||
          alternativa.features.length === 0
        ) {
          throw new Error('La ruta alternativa no contiene datos válidos.');
        }

        setResultado({
          mensaje: mensajeRaw,
          rutaPrimaria: primaria,
          rutaAlternativa: alternativa,
        });
      } else if (!Array.isArray(data) && data?.type === 'FeatureCollection') {
        // Retrocompatibilidad: si n8n aún devuelve un solo OrsResponse
        throw new Error(
          'El servidor devolvió una sola ruta. Se esperan dos rutas (formato nuevo de n8n).'
        );
      } else {
        throw new Error('La respuesta del servidor no tiene el formato esperado.');
      }
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
