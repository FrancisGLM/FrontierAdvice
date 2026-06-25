'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PasoFronterizo, FiltrosMapa, IconoClima, SenalPredictiva } from '@/lib/types';
import FilterSidebar from '../FilterSidebar/FilterSidebar';
import MapLegend from './MapLegend';
import PasoInfoPanel from '../PasoInfo/PasoInfoPanel';
import styles from './MapArea.module.css';

// Leaflet must be client-side only
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className={styles.loadingOverlay}>
      <div className="flex flex-col items-center">
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Cargando mapa interactivo...</p>
      </div>
    </div>
  ),
});

export default function MapDashboard() {
  const [pasosData, setPasosData] = useState<PasoFronterizo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPaso, setSelectedPaso] = useState<PasoFronterizo | null>(null);
  const [filtros, setFiltros] = useState<FiltrosMapa>({
    estado: 'todos',
    region: 'todas',
    busqueda: '',
  });

  useEffect(() => {
    async function fetchPasos() {
      try {
        const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

        // Fetch en paralelo: pasos + señales predictivas
        const [resPasos, resSenales] = await Promise.all([
          fetch(`${STRAPI_URL}/api/paso-fronterizos?pagination[limit]=100&populate=*`),
          fetch(`${STRAPI_URL}/api/senal-predictivas?pagination[limit]=500&populate[id_paso][fields][0]=id&sort=fecha_calculo:desc`),
        ]);

        if (!resPasos.ok) {
          throw new Error('Error al obtener datos de Strapi (Verifica que el rol Public tenga permiso "find" en PasoFronterizo)');
        }
        const json = await resPasos.json();

        // Construir mapa pasoId → SenalPredictiva[]
        const senalMap = new Map<string, SenalPredictiva[]>();
        if (resSenales.ok) {
          const jsonSenales = await resSenales.json();
          for (const s of (jsonSenales.data ?? [])) {
            const pasoId = String(s.id_paso?.id ?? s.id_paso);
            if (pasoId) {
              const currentList = senalMap.get(pasoId) || [];
              // Tomamos la más reciente de cada horizonte de horas
              if (!currentList.some((existing) => existing.horizonteHoras === s.horizonte_horas)) {
                currentList.push({
                  nivelRiesgo: s.nivel_riesgo as SenalPredictiva['nivelRiesgo'],
                  horizonteHoras: s.horizonte_horas,
                  motivoResumen: s.motivo_resumen ?? '',
                  tipoEvento: s.tipo_evento ?? '',
                  fechaCalculo: s.fecha_calculo,
                });
                senalMap.set(pasoId, currentList);
              }
            }
          }
        }

        function mapWeatherCodeToIcon(code: number): IconoClima {
          if (code === 0) return 'sol';
          if (code >= 1 && code <= 3) return 'nublado';
          if (code >= 45 && code <= 48) return 'nublado';
          if (code >= 55 && code <= 57) return 'lluvia_intensa'; // Drizzle intensa
          if (code >= 63 && code <= 67) return 'lluvia_intensa'; // Lluvia moderada/intensa
          if ((code >= 51 && code <= 54) || (code >= 58 && code <= 62) || (code >= 80 && code <= 82)) return 'lluvia';
          if (code === 82 || code === 83 || code === 84) return 'lluvia_intensa'; // Chubascos intensos
          if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'nieve';
          if (code >= 95 && code <= 99) return 'tormenta';
          return 'sol';
        }

        /**
         * Mapea el texto de la descripción al icono correspondiente.
         * Tiene PRIORIDAD sobre el weathercode para evitar discrepancias.
         */
        function mapDescripcionToIcon(descripcion: string): IconoClima | null {
          if (!descripcion) return null;
          const d = descripcion.toLowerCase();
          if (d.includes('tormenta') || d.includes('granizo') || d.includes('thunder')) return 'tormenta';
          if (d.includes('lluvia intensa') || d.includes('lluvia fuerte') || d.includes('chubascos fuertes') || d.includes('heavy rain')) return 'lluvia_intensa';
          if (d.includes('lluvia') || d.includes('llovizna') || d.includes('precipitaci')) return 'lluvia';
          if (d.includes('nieve') || d.includes('nevada') || d.includes('copo') || d.includes('snow')) return 'nieve';
          if (d.includes('parcialmente') || d.includes('parcial') || d.includes('partly')) return 'nublado';
          if (d.includes('nublado') || d.includes('nuboso') || d.includes('nubes') || d.includes('cloudy')) return 'nublado';
          if (d.includes('despejado') || d.includes('soleado') || d.includes('clear') || d.includes('sunny')) return 'sol';
          return null;
        }

        // Mapear respuesta de Strapi v5 a tipo frontend PasoFronterizo
        const mapeados: PasoFronterizo[] = json.data.map((item: any) => {
          const climaData = item.clima_actuals && item.clima_actuals.length > 0 ? item.clima_actuals[0] : null;
          
          let climaActual = undefined;
          let pronostico = [];

          if (climaData) {
            climaActual = {
              temperatura: climaData.temperatura_actual,
              sensacionTermica: climaData.temperatura_actual, // Approximation
              descripcion: climaData.descripcion_actual,
              icono: mapDescripcionToIcon(climaData.descripcion_actual) ?? mapWeatherCodeToIcon(climaData.weathercode),
              viento: climaData.viento_actual,
              humedad: climaData.humedad_actual,
              visibilidad: 10, // Default
              presion: 1013, // Default
            };

            if (climaData.pronostico_3dias && Array.isArray(climaData.pronostico_3dias)) {
              pronostico = climaData.pronostico_3dias.map((p: any) => ({
                dia: new Date(p.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short' }),
                // La descripción tiene prioridad sobre el weathercode para evitar discrepancias
                icono: mapDescripcionToIcon(p.descripcion) ?? mapWeatherCodeToIcon(p.weathercode),
                riesgo: p.nivel_riesgo ? p.nivel_riesgo.toLowerCase() : 'bajo',
                alerta: p.descripcion
              }));
            }
          }

          return {
            id: String(item.id),
            nombre: item.nombre_oficial,
            lat: item.latitud,
            lng: item.longitud,
            estado: item.activo ? 'abierto' : 'cerrado',
            region: item.region,
            ultimaActualizacion: new Date(item.updatedAt || Date.now()).toLocaleDateString(),
            altitud: item.altitud || undefined,
            pronostico: pronostico,
            climaActual: climaActual,
            senalPredictivas: senalMap.get(String(item.id))?.sort((a, b) => a.horizonteHoras - b.horizonteHoras),
          };
        });
        
        setPasosData(mapeados);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPasos();
  }, []);

  const pasosFiltrados = useMemo(() => {
    return pasosData.filter((p) => {
      if (filtros.estado === 'abiertos' && p.estado !== 'abierto') return false;
      if (filtros.region !== 'todas' && p.region !== filtros.region) return false;
      if (filtros.busqueda) {
        const q = filtros.busqueda.toLowerCase();
        if (!p.nombre.toLowerCase().includes(q) && !p.subtitulo?.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [filtros, pasosData]);

  const handleSelectPaso = (paso: PasoFronterizo) => {
    setSelectedPaso((prev) => (prev?.id === paso.id ? null : paso));
  };

  return (
    <div className="flex flex-1 w-full h-full relative overflow-hidden">
      <FilterSidebar
        filtros={filtros}
        onFiltros={(partial) => setFiltros((prev) => ({ ...prev, ...partial }))}
        pasos={pasosFiltrados}
        onSelectPaso={handleSelectPaso}
        selectedPasoId={selectedPaso?.id}
      />

      <div className={`${styles.mapArea} flex-1 relative w-full h-full bg-[var(--bg-base)]`}>
        <MapLegend />
        
        {loading ? (
          <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-[var(--bg-base)] w-full h-full">
            <div className={styles.spinner} />
            <p className="mt-4 text-sm font-medium text-slate-400">Cargando puntos de Strapi...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 z-[2000] flex w-full h-full items-center justify-center bg-[var(--bg-base)]">
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-2xl border border-red-200 dark:border-red-900/30 max-w-md text-center">
              <span className="text-4xl mb-4 block">⚠️</span>
              <h2 className="text-xl font-bold mb-2">Error de Conexión</h2>
              <p>{error}</p>
            </div>
          </div>
        ) : (
          <MapView
            pasos={pasosFiltrados}
            onSelectPaso={handleSelectPaso}
            selectedPasoId={selectedPaso?.id}
          />
        )}
      </div>

      <PasoInfoPanel 
        paso={selectedPaso} 
        onClose={() => setSelectedPaso(null)} 
      />
    </div>
  );
}
