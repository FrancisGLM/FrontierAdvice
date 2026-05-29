'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { PasoFronterizo, FiltrosMapa } from '@/lib/types';
import { pasosFronterizos } from '@/lib/mockData';
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
  const [selectedPaso, setSelectedPaso] = useState<PasoFronterizo | null>(null);
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

  return (
    <>
      <FilterSidebar
        filtros={filtros}
        onFiltros={(partial) => setFiltros((prev) => ({ ...prev, ...partial }))}
        pasos={pasosFiltrados}
        onSelectPaso={handleSelectPaso}
        selectedPasoId={selectedPaso?.id}
      />

      <div className={styles.mapArea}>
        <MapLegend />
        <MapView
          pasos={pasosFiltrados}
          onSelectPaso={handleSelectPaso}
          selectedPasoId={selectedPaso?.id}
        />
      </div>

      <PasoInfoPanel 
        paso={selectedPaso} 
        onClose={() => setSelectedPaso(null)} 
      />
    </>
  );
}
