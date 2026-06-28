'use client';

import { X, Clock, Mountain, MapPin, Car, Bus, Truck, Info, MessageSquare } from 'lucide-react';
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
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (paso) {
      setActivePaso(paso);
      setTranslateY(0);
      setIsDragging(false);
      // Wait for DOM paint before adding .open class to trigger CSS transition
      const frameId = requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsMounted(true));
      });
      return () => cancelAnimationFrame(frameId);
    } else {
      setIsMounted(false);
      const timer = setTimeout(() => setActivePaso(null), 400); // match transition duration
      return () => clearTimeout(timer);
    }
  }, [paso]);

  const displayPaso = paso || activePaso;

  if (!displayPaso) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 0) {
      setTranslateY(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (translateY > 120) {
      // Clearing translateY lets the CSS transition take over and animate it offscreen
      setTranslateY(0);
      onClose();
    } else {
      // Snap back to 0 smoothly
      setTranslateY(0);
    }
    setTouchStartY(null);
  };

  const cfg = estadoConfig[displayPaso.estado];
  const diario = displayPaso.estado_diarios;

  // Helper for vehicle status
  const getVehicleStatus = (type: string) => {
    if (!diario || !diario.tipo_vehiculos) return 'red';
    const isAllowed = diario.tipo_vehiculos.includes(type);
    if (!isAllowed) return 'red';
    
    // Check if chains are mentioned
    const msg = ((diario.mensaje_original || '') + ' ' + (diario.motivo_estado || '')).toLowerCase();
    if (msg.includes('cadena') || msg.includes('porte obligatorio')) {
      return 'yellow';
    }
    return 'green';
  };

  const statusColors = {
    green: { bg: '#dcfce7', text: '#166534', icon: '#22c55e' },
    yellow: { bg: '#fef9c3', text: '#854d0e', icon: '#eab308' },
    red: { bg: '#fee2e2', text: '#991b1b', icon: '#ef4444' }
  };
  
  // Calculate dynamic opacity for the backdrop during drag
  const backdropOpacity = Math.max(0, 1 - (translateY / 250));

  return (
    <>
      <aside 
        className={`${styles.panel} ${isMounted ? styles.open : ''}`}
        style={{ 
          transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
          transition: isDragging ? 'none' : undefined 
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.pullHandle} />
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                <MapPin size={12} />
                <p className={styles.pasoSubtitle} style={{ margin: 0 }}>Región: {displayPaso.region}</p>
              </div>
              {displayPaso.subtitulo && (
                <p className={styles.pasoSubtitle}>{displayPaso.subtitulo}</p>
              )}
            </div>
            <div className={styles.flags}>
              <CountryFlag country="CL" />
              <CountryFlag country={getBorderCountry(displayPaso.nombre)} />
            </div>
          </div>

          {/* Última actualización */}
          <div className={styles.metaItem} style={{ marginTop: '-0.25rem', marginBottom: '0.25rem' }}>
            <Clock size={14} className={styles.metaIcon} />
            <span style={{ fontSize: '0.8125rem' }}>
              Última actualización: {
                diario?.fecha_reporte 
                  ? new Date(diario.fecha_reporte).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : displayPaso.ultimaActualizacion
              }
            </span>
          </div>

          {/* Estado actual y Horario */}
          <div>
            <h3 className={styles.sectionTitle}>Estado actual</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div className={styles.statusBadge} style={{ backgroundColor: cfg.bg, margin: 0 }}>
                <div className={styles.statusDot} style={{ backgroundColor: cfg.text }} />
                <span className={styles.statusText} style={{ color: cfg.text }}>
                  {cfg.label}
                </span>
              </div>
              
              {diario && (
                <div className={styles.dailySchedule} style={{ margin: 0 }}>
                  <Clock size={16} className={styles.metaIcon} />
                  <span>
                    {diario.horario_apertura && diario.horario_cierre
                      ? `${diario.horario_apertura} a ${diario.horario_cierre}`
                      : 'Sin horario especificado'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Vehículos */}
          {diario && (
            <div className={styles.vehiclesContainer}>
              {[
                { id: 'automóvil', Icon: Car, label: 'Autos' },
                { id: 'bus', Icon: Bus, label: 'Buses' },
                { id: 'camión', Icon: Truck, label: 'Camiones' }
              ].map(({ id, Icon, label }) => {
                const status = getVehicleStatus(id);
                const colorCfg = statusColors[status];
                return (
                  <div key={id} className={styles.vehicleBadge} style={{ backgroundColor: colorCfg.bg, color: colorCfg.text }}>
                    <Icon size={16} style={{ color: colorCfg.icon }} />
                    <span className={styles.vehicleLabel}>{label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Meta info */}
          <div className={styles.metaList}>
            {displayPaso.altitud && (
              <div className={styles.metaItem}>
                <Mountain size={16} className={styles.metaIcon} />
                <span>Altitud: {displayPaso.altitud.toLocaleString()} m.s.n.m.</span>
              </div>
            )}
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
        className={`md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] transition-opacity ${paso ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{ 
          opacity: paso ? backdropOpacity : 0,
          transition: isDragging ? 'none' : 'opacity 0.4s ease'
        }}
        onClick={onClose}
      />
    </>
  );
}
