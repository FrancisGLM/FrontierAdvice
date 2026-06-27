'use client';

import { Search, ChevronDown, AlertTriangle, Bug, Filter, X } from 'lucide-react';
import { useState } from 'react';
import { PasoFronterizo, FiltrosMapa } from '@/lib/types';
import { regiones } from '@/lib/mockData';
import styles from './FilterSidebar.module.css';
import IncidenteModal from '@/components/IncidenteModal/IncidenteModal';

interface FilterSidebarProps {
  filtros: FiltrosMapa;
  onFiltros: (f: Partial<FiltrosMapa>) => void;
  pasos: PasoFronterizo[];
  onSelectPaso: (p: PasoFronterizo) => void;
  selectedPasoId?: string;
}

const estadoBadge: Record<string, { bg: string; text: string; label: string }> = {
  abierto: { bg: 'var(--status-open-bg)', text: 'var(--status-open)', label: 'Abierto' },
  precaucion: { bg: 'var(--status-caution-bg)', text: 'var(--status-caution)', label: 'Precaución' },
  cerrado: { bg: 'var(--status-closed-bg)', text: 'var(--status-closed)', label: 'Cerrado' },
};

export default function FilterSidebar({
  filtros,
  onFiltros,
  pasos,
  onSelectPaso,
  selectedPasoId,
}: FilterSidebarProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [incidenteOpen, setIncidenteOpen] = useState(false);

  return (
    <>
      <aside className={`${styles.sidebar} ${isOpenMobile ? styles.open : ''}`}>
        {/* Mobile Toggle Button */}
        <button 
          className={styles.mobileToggle} 
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          title="Filtros"
        >
          {isOpenMobile ? <X size={18} /> : <Filter size={18} />}
        </button>

        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>FrontierAdvice</h1>
          <p className={styles.subtitle}>Monitoreo de pasos fronterizos</p>
        </div>

        {/* Search */}
        <div className={styles.searchSection}>
          <div className={styles.inputWrapper}>
            <Search className={styles.searchIcon} size={14} />
            <input
              type="text"
              placeholder="Buscar paso..."
              value={filtros.busqueda}
              onChange={(e) => onFiltros({ busqueda: e.target.value })}
              className={styles.input}
            />
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filtersSection}>
          {(['todos', 'abiertos'] as const).map((val) => (
            <label key={val} className={styles.radioLabel}>
              <div className={`${styles.radioCircle} ${filtros.estado === val ? styles.active : ''}`}
                onClick={() => onFiltros({ estado: val })}
              >
                {filtros.estado === val && <div className={styles.radioDot} />}
              </div>
              <span className={styles.radioText}>
                {val === 'todos' ? 'Todos los Pasos' : 'Solo Abiertos'}
              </span>
            </label>
          ))}

          {/* Region dropdown */}
          <div className={styles.selectWrapper}>
            <select
              value={filtros.region}
              onChange={(e) => onFiltros({ region: e.target.value })}
              className={styles.select}
            >
              <option value="todas">Todas las Regiones</option>
              {regiones.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <ChevronDown className={styles.selectIcon} size={14} />
          </div>
        </div>

        {/* Paso list */}
        <div className={styles.listSection}>
          <p className={styles.listHeader}>
            {pasos.length} paso{pasos.length !== 1 ? 's' : ''} encontrados
          </p>
          {[...pasos].sort((a, b) => b.lat - a.lat).map((paso) => {
            const badge = estadoBadge[paso.estado];
            const isSelected = paso.id === selectedPasoId;
            return (
              <button
                key={paso.id}
                onClick={() => {
                  onSelectPaso(paso);
                  if (window.innerWidth <= 768) setIsOpenMobile(false);
                }}
                className={`${styles.pasoItem} ${isSelected ? styles.selected : ''}`}
              >
                <div className={styles.pasoHeader}>
                  <div
                    className={styles.statusDot}
                    style={{ backgroundColor: badge.text }}
                  />
                  <div className={styles.pasoInfo}>
                    <p className={styles.pasoName} title={paso.nombre}>{paso.nombre}</p>
                    {paso.subtitulo && (
                      <p className={styles.pasoSubtitle} title={paso.subtitulo}>
                        {paso.subtitulo}
                      </p>
                    )}
                    <span 
                      className={styles.badge}
                      style={{ backgroundColor: badge.bg, color: badge.text }}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom buttons */}
        <div className={styles.bottomSection}>
          <button
            id="sidebar-reportar-incidente"
            onClick={() => setIncidenteOpen(true)}
            className={styles.primaryButton}
          >
            <AlertTriangle size={14} />
            Reportar incidente
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Incidente Modal */}
      <IncidenteModal
        open={incidenteOpen}
        onClose={() => setIncidenteOpen(false)}
      />
    </>
  );
}
