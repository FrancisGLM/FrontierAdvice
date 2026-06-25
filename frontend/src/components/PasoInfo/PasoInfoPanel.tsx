'use client';

import { X, Clock, Mountain, MapPin } from 'lucide-react';
import { PasoFronterizo } from '@/lib/types';
import WeatherForecast from './WeatherForecast';
import CurrentWeather from './CurrentWeather';
import PredictionBadge from './PredictionBadge';
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

function getBorderCountry(nombre: string): 'AR' | 'BO' | 'PE' {
  const n = nombre.toLowerCase();
  if (n.includes('chacalluta')) return 'PE';
  if (n.includes('chungar') || n.includes('visviri') || n.includes('colchane') || n.includes('ollagüe') || n.includes('hito cajón')) return 'BO';
  return 'AR';
}

function CountryFlag({ country }: { country: 'CL' | 'AR' | 'BO' | 'PE' }) {
  if (country === 'CL') {
    return (
      <svg width="24" height="16" viewBox="0 0 3 2" className="rounded-sm shadow-sm">
        <rect width="3" height="2" fill="#d52b1e"/>
        <rect width="3" height="1" fill="#fff"/>
        <rect width="1" height="1" fill="#0039a6"/>
        <polygon points="0.5,0.1 0.6,0.4 0.9,0.4 0.65,0.6 0.75,0.9 0.5,0.7 0.25,0.9 0.35,0.6 0.1,0.4 0.4,0.4" fill="#fff"/>
      </svg>
    );
  }
  if (country === 'PE') {
    return (
      <svg width="24" height="16" viewBox="0 0 3 2" className="rounded-sm shadow-sm">
        <rect width="1" height="2" fill="#D91023"/>
        <rect width="1" height="2" x="1" fill="#fff"/>
        <rect width="1" height="2" x="2" fill="#D91023"/>
      </svg>
    );
  }
  if (country === 'BO') {
    return (
      <svg width="24" height="16" viewBox="0 0 3 3" className="rounded-sm shadow-sm">
        <rect width="3" height="1" fill="#D52B1E"/>
        <rect width="3" height="1" y="1" fill="#F9E000"/>
        <rect width="3" height="1" y="2" fill="#007934"/>
      </svg>
    );
  }
  return (
    <svg width="24" height="16" viewBox="0 0 3 2" className="rounded-sm shadow-sm">
      <rect width="3" height="2" fill="#74acdf"/>
      <rect width="3" height="0.66" y="0.66" fill="#fff"/>
      <circle cx="1.5" cy="1" r="0.25" fill="#f6b40e"/>
    </svg>
  );
}

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
              <CountryFlag country="CL" />
              <CountryFlag country={getBorderCountry(displayPaso.nombre)} />
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

          {/* Predicción IA */}
          {displayPaso.senalPredictivas && displayPaso.senalPredictivas.length > 0 && (
            <PredictionBadge senales={displayPaso.senalPredictivas} />
          )}

          {/* Current Weather */}
          {displayPaso.climaActual && (
            <CurrentWeather clima={displayPaso.climaActual} />
          )}

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
