'use client';

import { X, Clock, Mountain, MapPin } from 'lucide-react';
import { PasoFronterizo } from '@/lib/types';
import WeatherForecast from './WeatherForecast';
import CurrentWeather from './CurrentWeather';
import styles from './PasoInfo.module.css';

interface PasoInfoPanelProps {
  paso: PasoFronterizo | null;
  onClose: () => void;
}

const estadoConfig = {
  abierto: { label: 'ABIERTO', bg: 'var(--status-open-bg)', text: 'var(--status-open)' },
  precaucion: { label: 'PRECAUCIÓN', bg: 'var(--status-caution-bg)', text: 'var(--status-caution)' },
  cerrado: { label: 'CERRADO', bg: 'var(--status-closed-bg)', text: 'var(--status-closed)' },
};

import { useState, useEffect } from 'react';

export default function PasoInfoPanel({ paso, onClose }: PasoInfoPanelProps) {
  const [activePaso, setActivePaso] = useState<PasoFronterizo | null>(paso);

  useEffect(() => {
    if (paso) {
      setActivePaso(paso);
    } else {
      const timer = setTimeout(() => setActivePaso(null), 400); // match transition duration
      return () => clearTimeout(timer);
    }
  }, [paso]);

  const displayPaso = paso || activePaso;

  if (!displayPaso) return null;

  const cfg = estadoConfig[displayPaso.estado];

  return (
    <>
      <aside className={`${styles.panel} ${paso ? styles.open : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Información del Paso</h2>
          <button onClick={onClose} className={styles.closeButton} title="Cerrar panel">
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {/* Paso identity card */}
          <div 
            className={styles.identityCard}
            style={{ backgroundColor: cfg.bg, borderColor: cfg.text, borderWidth: '1px' }}
          >
            <div className={styles.iconWrapper} style={{ backgroundColor: cfg.text }}>
              <Mountain size={20} />
            </div>
            <div className={styles.identityInfo}>
              <h3 className={styles.pasoName}>{displayPaso.nombre}</h3>
              {displayPaso.subtitulo && (
                <p className={styles.pasoSubtitle}>{displayPaso.subtitulo}</p>
              )}
            </div>
            <div className={styles.flags}>
              <span>🇨🇱</span>
              <span>🇦🇷</span>
            </div>
          </div>

          {/* Estado actual */}
          <div>
            <h3 className={styles.sectionTitle}>Estado actual</h3>
            <div className={styles.statusBadge} style={{ backgroundColor: cfg.bg }}>
              <div className={styles.statusDot} style={{ backgroundColor: cfg.text }} />
              <span className={styles.statusText} style={{ color: cfg.text }}>
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Meta info */}
          <div className={styles.metaList}>
            <div className={styles.metaItem}>
              <Clock size={16} className={styles.metaIcon} />
              <span>Última actualización: {displayPaso.ultimaActualizacion}</span>
            </div>
            {displayPaso.altitud && (
              <div className={styles.metaItem}>
                <Mountain size={16} className={styles.metaIcon} />
                <span>Altitud: {displayPaso.altitud.toLocaleString()} m.s.n.m.</span>
              </div>
            )}
            <div className={styles.metaItem}>
              <MapPin size={16} className={styles.metaIcon} />
              <span>Región: {displayPaso.region}</span>
            </div>
          </div>

          {/* Current Weather */}
          {displayPaso.climaActual && (
            <CurrentWeather clima={displayPaso.climaActual} />
          )}

          <div className={styles.divider} />

          {/* Forecast */}
          <WeatherForecast pronostico={displayPaso.pronostico} />
        </div>
      </aside>

      {/* Mobile Backdrop */}
      <div 
        className={`md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] transition-opacity ${paso ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
    </>
  );
}
