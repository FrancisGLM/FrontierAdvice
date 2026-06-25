'use client';

import { useState, useCallback } from 'react';
import type { OrsResponse } from '@/lib/types';

export type PaisDestino = 'Argentina' | 'Bolivia' | 'Peru';
export type TipoVehiculo = 'coche' | 'camion';
export type SubtipoCamion =
  | 'general'
  | 'autobus'
  | 'agricola'
  | 'forestal'
  | 'reparto'
  | 'mercancia';

export interface RutaParams {
  origen: string;
  destino: string;
  paisDestino: PaisDestino;
  tipoVehiculo: TipoVehiculo;
  subtipoCamion?: SubtipoCamion;
}

interface UseCalcularRutaReturn {
  calcular: (params: RutaParams) => Promise<void>;
  limpiar: () => void;
  loading: boolean;
  error: string | null;
  ruta: OrsResponse | null;
}

export function useCalcularRuta(): UseCalcularRutaReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [ruta, setRuta]       = useState<OrsResponse | null>(null);

  const calcular = useCallback(async (params: RutaParams) => {
    setLoading(true);
    setError(null);
    setRuta(null);

    const webhookUrl =
      process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ??
      'http://localhost:5678/webhook/calcular-ruta';

    try {
      const res = await fetch(webhookUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(params),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
          `El servidor respondió con ${res.status}${text ? `: ${text}` : ''}`
        );
      }

      // n8n retorna el OrsResponse directamente (o envuelto en array)
      const data: OrsResponse | OrsResponse[] = await res.json();
      const orsResponse: OrsResponse = Array.isArray(data) ? data[0] : data;

      if (
        orsResponse.type !== 'FeatureCollection' ||
        !Array.isArray(orsResponse.features) ||
        orsResponse.features.length === 0
      ) {
        throw new Error(
          'La respuesta del servidor no contiene una ruta válida.'
        );
      }

      setRuta(orsResponse);
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
    setRuta(null);
    setError(null);
  }, []);

  return { calcular, limpiar, loading, error, ruta };
}
