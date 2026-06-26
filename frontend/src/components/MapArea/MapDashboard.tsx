'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Eye } from 'lucide-react';
import { PasoFronterizo, FiltrosMapa, N8nDobleRutaResponse } from '@/lib/types';
import { pasosFronterizos } from '@/lib/mockData';
import FilterSidebar from '../FilterSidebar/FilterSidebar';
import MapLegend from './MapLegend';
import PasoInfoPanel from '../PasoInfo/PasoInfoPanel';
import RutaPanel from '../RutaPanel/RutaPanel';
import ResultadosPanel from '../RutaPanel/ResultadosPanel';
import NavRail from '../NavRail/NavRail';
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

// Panel izquierdo activo — 'filtros' | 'ruta' | 'resultados'
type LeftPanel = 'filtros' | 'ruta' | 'resultados';

export default function MapDashboard() {
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

  const pasosFiltrados = useMemo(() => {
    return pasosFronterizos.filter((p) => {
      if (filtros.estado === 'abiertos' && p.estado !== 'abierto') return false;
      if (filtros.region !== 'todas' && p.region !== filtros.region) return false;
      if (filtros.busqueda) {
        const q = filtros.busqueda.toLowerCase();
        if (!p.nombre.toLowerCase().includes(q) && !p.subtitulo?.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [filtros]);

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
    <>
      {/* NavRail */}
      <NavRail rutaOpen={rutaOpen} onRutaToggle={handleRutaToggle} />

      {/* Panel izquierdo: filtros */}
      {leftPanel === 'filtros' && (
        <FilterSidebar
          filtros={filtros}
          onFiltros={(partial) => setFiltros((prev) => ({ ...prev, ...partial }))}
          pasos={pasosFiltrados}
          onSelectPaso={handleSelectPaso}
          selectedPasoId={selectedPaso?.id}
        />
      )}

      {/* Panel izquierdo: formulario Calcular Ruta */}
      {leftPanel === 'ruta' && (
        <RutaPanel onRutaCalculada={handleRutaCalculada} />
      )}

      {/* Panel izquierdo: Resultados Ruta (aparece tras Finalizar, en el mismo lado) */}
      {leftPanel === 'resultados' && (
        <ResultadosPanel
          resultado={rutaResultado}
          pasos={pasosFiltrados}
          onSelectPaso={handleSelectPaso}
          onLimpiar={handleLimpiarRuta}
          onClose={() => setLeftPanel('filtros')}
          alternativeIsFocused={alternativeIsFocused}
          onToggleFocus={handleToggleFocus}
        />
      )}

      {/* Mapa */}
      <div className={styles.mapArea}>
        <MapLegend />

        <MapView
          pasos={pasosFiltrados}
          onSelectPaso={handleSelectPaso}
          selectedPasoId={selectedPaso?.id}
          rutaResultado={rutaResultado}
          alternativeIsFocused={alternativeIsFocused}
        />

        {/* Botón flotante "Revisualizar Ruta" — aparece cuando hay resultado y el panel izquierdo NO muestra resultados */}
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
    </>
  );
}
