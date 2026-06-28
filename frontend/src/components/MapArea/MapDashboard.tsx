'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Eye } from 'lucide-react';
import { PasoFronterizo, FiltrosMapa, IconoClima, SenalPredictiva, N8nDobleRutaResponse } from '@/lib/types';
import FilterSidebar from '../FilterSidebar/FilterSidebar';
import MapLegend from './MapLegend';
import PasoInfoPanel from '../PasoInfo/PasoInfoPanel';
import RutaPanel from '../RutaPanel/RutaPanel';
import ResultadosPanel from '../RutaPanel/ResultadosPanel';
import NavRail from '../NavRail/NavRail';
import styles from './MapArea.module.css';
import { STRAPI_URL } from '@/lib/config';

// Leaflet must be client-side only
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className={styles.loadingOverlay}>
      <div className="flex flex-col items-center">
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Cargando mapa...</p>
      </div>
    </div>
  ),
});

// Panel izquierdo activo — 'filtros' | 'ruta' | 'resultados'
type LeftPanel = 'filtros' | 'ruta' | 'resultados';

export default function MapDashboard() {
  const [pasosData, setPasosData] = useState<PasoFronterizo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPaso, setSelectedPaso] = useState<PasoFronterizo | null>(null);

  // Panel izquierdo: filtros (default) | formulario ruta | resultados ruta
  const [leftPanel, setLeftPanel] = useState<LeftPanel>('filtros');

  // Resultado de doble ruta (nuevo formato n8n)
  const [rutaResultado, setRutaResultado] = useState<N8nDobleRutaResponse | null>(null);

  // C7/C8: estado de enfoque (primaria vs alternativa)
  const [alternativeIsFocused, setAlternativeIsFocused] = useState(false);

  const [filtros, setFiltros] = useState<FiltrosMapa>({
    estado: 'todos',
    region: 'todas',
    busqueda: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('tab') === 'ruta') {
        setLeftPanel('ruta');
        window.history.replaceState(null, '', '/mapa');
      }
    }
  }, []);

  useEffect(() => {
    async function fetchPasos() {
      try {
        // Fetch en paralelo: pasos + señales predictivas + estado diario
        const baseUrl = STRAPI_URL.replace(/\/$/, '');
        const [resPasos, resSenales, resDiarios] = await Promise.all([
          fetch(`${baseUrl}/api/paso-fronterizos?pagination[limit]=100&populate=*`, { cache: 'no-store' }),
          fetch(`${baseUrl}/api/senal-predictivas?pagination[limit]=500&populate[id_paso][fields][0]=id&sort=fecha_calculo:desc`, { cache: 'no-store' }),
          fetch(`${baseUrl}/api/estado-diarios?pagination[limit]=500&populate[id_paso][fields][0]=id&sort=createdAt:desc`, { cache: 'no-store' }),
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

        // Construir mapa pasoId → EstadoDiario (tomando el más reciente por createdAt:desc)
        const diarioMap = new Map<string, any>();
        if (resDiarios.ok) {
          const jsonDiarios = await resDiarios.json();
          for (const d of (jsonDiarios.data ?? [])) {
            const pasoId = String(d.id_paso?.id ?? d.id_paso?.documentId ?? d.id_paso);
            if (pasoId && !diarioMap.has(pasoId)) {
              diarioMap.set(pasoId, d);
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

          let estadoDiarioData = diarioMap.get(String(item.id));

          let estadoFinal: 'abierto' | 'precaucion' | 'cerrado' = item.activo ? 'abierto' : 'cerrado';
          if (item.activo && estadoDiarioData) {
            const eg = (estadoDiarioData.estado_general || '').toLowerCase();
            if (eg.includes('cerrado') || eg.includes('suspendido')) estadoFinal = 'cerrado';
            else if (eg.includes('precaucion') || eg.includes('desconocido')) estadoFinal = 'precaucion';
            else if (eg.includes('abierto')) estadoFinal = 'abierto';
          }

          return {
            id: String(item.id),
            documentId: item.documentId,
            nombre: item.nombre_oficial,
            lat: item.latitud,
            lng: item.longitud,
            estado: estadoFinal,
            region: item.region,
            ultimaActualizacion: new Date(item.updatedAt || Date.now()).toLocaleDateString(),
            altitud: item.altitud || undefined,
            pronostico: pronostico,
            climaActual: climaActual,
            senalPredictivas: senalMap.get(String(item.id))?.sort((a, b) => a.horizonteHoras - b.horizonteHoras),
            estado_diarios: estadoDiarioData,
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

  // Botón "Ruta" en NavRail: alterna entre formulario y filtros
  const handleRutaToggle = useCallback(() => {
    setLeftPanel((prev) => (prev === 'ruta' ? 'filtros' : 'ruta'));
  }, []);

  // Al finalizar cálculo: cerrar formulario, mostrar resultados a la izquierda
  const handleRutaCalculada = useCallback((resultado: N8nDobleRutaResponse | null) => {
    setRutaResultado(resultado);
    if (resultado) {
      setLeftPanel('resultados');
      setAlternativeIsFocused(false);
    }
  }, []);

  // Limpiar ruta — borra rutas, vuelve a filtros
  const handleLimpiarRuta = useCallback(() => {
    setRutaResultado(null);
    setLeftPanel('filtros');
    setAlternativeIsFocused(false);
  }, []);

  // C8: Toggle de enfoque entre ruta primaria y alternativa
  const handleToggleFocus = useCallback(() => {
    setAlternativeIsFocused((prev) => !prev);
  }, []);

  // Botón Revisualizar Ruta: vuelve a mostrar panel de resultados a la izquierda
  const handleRevisualizar = useCallback(() => {
    setLeftPanel('resultados');
  }, []);

  const rutaOpen = leftPanel === 'ruta';

  return (
    <div className="flex flex-1 w-full h-full relative overflow-hidden">
      {/* NavRail */}
      <NavRail 
        rutaOpen={rutaOpen} 
        onRutaToggle={handleRutaToggle} 
        onMapaClick={() => setLeftPanel('filtros')} 
      />

      {/* Paneles Izquierdos (Filtros, Ruta, Resultados) superpuestos en Grid */}
      <div className="relative flex-shrink-0 grid grid-cols-1 grid-rows-1 z-40">
        {/* Panel izquierdo: filtros */}
        <div style={{ gridArea: '1 / 1' }}>
          <FilterSidebar
            isOpen={leftPanel === 'filtros'}
            filtros={filtros}
            onFiltros={(partial) => setFiltros((prev) => ({ ...prev, ...partial }))}
            pasos={pasosFiltrados}
            onSelectPaso={handleSelectPaso}
            selectedPasoId={selectedPaso?.id}
          />
        </div>

        {/* Panel izquierdo: formulario Calcular Ruta */}
        <div style={{ gridArea: '1 / 1' }}>
          <RutaPanel 
            isOpen={leftPanel === 'ruta'}
            onRutaCalculada={handleRutaCalculada} 
          />
        </div>

        {/* Panel izquierdo: Resultados Ruta */}
        <div style={{ gridArea: '1 / 1' }}>
          <ResultadosPanel
            isOpen={leftPanel === 'resultados'}
            resultado={rutaResultado}
            pasos={pasosFiltrados}
            onSelectPaso={handleSelectPaso}
            onLimpiar={handleLimpiarRuta}
            onClose={() => setLeftPanel('filtros')}
            alternativeIsFocused={alternativeIsFocused}
            onToggleFocus={handleToggleFocus}
          />
        </div>
      </div>

      {/* Mapa */}
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
            rutaResultado={rutaResultado}
            alternativeIsFocused={alternativeIsFocused}
          />
        )}

        {/* Botón flotante "Revisualizar Ruta" */}
        {rutaResultado && leftPanel !== 'resultados' && (
          <button
            className={styles.revisualizeBtn}
            onClick={handleRevisualizar}
            title="Ver resultados de la ruta calculada"
          >
            <Eye size={14} />
            Revisualizar Ruta
          </button>
        )}
      </div>

      {/* Panel de información del paso (derecha) — independiente, no bloquea ResultadosPanel */}
      <PasoInfoPanel
        paso={selectedPaso}
        onClose={() => setSelectedPaso(null)}
      />
    </div>
  );
}
