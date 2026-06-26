'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
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

// C2: Panel izquierdo activo — 'filtros' | 'ruta' | null
type LeftPanel = 'filtros' | 'ruta';

export default function MapDashboard() {
  const [selectedPaso, setSelectedPaso] = useState<PasoFronterizo | null>(null);

  // C2: Sistema de paneles mutuamente exclusivos
  const [leftPanel, setLeftPanel] = useState<LeftPanel>('filtros');

  // Resultado de doble ruta (nuevo formato n8n)
  const [rutaResultado, setRutaResultado] = useState<N8nDobleRutaResponse | null>(null);

  // Panel de resultados abierto/cerrado
  const [resultadosPanelOpen, setResultadosPanelOpen] = useState(false);

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

  // C2: El botón "Ruta" abre el RutaPanel y cierra FilterSidebar (y viceversa)
  const handleRutaToggle = useCallback(() => {
    setLeftPanel((prev) => (prev === 'ruta' ? 'filtros' : 'ruta'));
  }, []);

  // Recibir el resultado de n8n desde RutaPanel
  const handleRutaCalculada = useCallback((resultado: N8nDobleRutaResponse | null) => {
    setRutaResultado(resultado);
    if (resultado) {
      // Abrir panel de resultados automáticamente al recibir respuesta
      setResultadosPanelOpen(true);
      // Resetear enfoque a ruta primaria cuando se calcula una nueva ruta
      setAlternativeIsFocused(false);
    }
  }, []);

  // C5/E: Limpiar ruta — borra rutas, cierra panel resultados, resetea estado
  const handleLimpiarRuta = useCallback(() => {
    setRutaResultado(null);
    setResultadosPanelOpen(false);
    setAlternativeIsFocused(false);
    // Nota: el formulario RutaPanel mantiene sus campos (no se limpia)
  }, []);

  // C8: Toggle de enfoque entre ruta primaria y alternativa
  const handleToggleFocus = useCallback(() => {
    setAlternativeIsFocused((prev) => !prev);
  }, []);

  const rutaOpen = leftPanel === 'ruta';

  return (
    <>
      {/* NavRail — embebido aquí para recibir props de rutaOpen */}
      <NavRail rutaOpen={rutaOpen} onRutaToggle={handleRutaToggle} />

      {/* C2: Panel de filtros — visible solo cuando leftPanel === 'filtros' */}
      {leftPanel === 'filtros' && (
        <FilterSidebar
          filtros={filtros}
          onFiltros={(partial) => setFiltros((prev) => ({ ...prev, ...partial }))}
          pasos={pasosFiltrados}
          onSelectPaso={handleSelectPaso}
          selectedPasoId={selectedPaso?.id}
        />
      )}

      {/* C2: Panel de rutas — visible solo cuando leftPanel === 'ruta' */}
      {leftPanel === 'ruta' && (
        <RutaPanel onRutaCalculada={handleRutaCalculada} />
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
      </div>

      {/* Panel de información del paso (derecha) */}
      <PasoInfoPanel
        paso={selectedPaso}
        onClose={() => setSelectedPaso(null)}
      />

      {/* C5: Panel de resultados de ruta (derecha, sobre PasoInfoPanel) */}
      <ResultadosPanel
        resultado={resultadosPanelOpen ? rutaResultado : null}
        pasos={pasosFiltrados}
        onSelectPaso={handleSelectPaso}
        onLimpiar={handleLimpiarRuta}
        onClose={() => setResultadosPanelOpen(false)}
        alternativeIsFocused={alternativeIsFocused}
        onToggleFocus={handleToggleFocus}
      />
    </>
  );
}
