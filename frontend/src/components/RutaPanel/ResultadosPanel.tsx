'use client';

import { useState, useEffect } from 'react';
import { X, Ruler, Clock, MapPin, ArrowLeftRight, ExternalLink, Route } from 'lucide-react';
import type { N8nDobleRutaResponse, OrsResponse, PasoFronterizo } from '@/lib/types';
import styles from './ResultadosPanel.module.css';

interface ResultadosPanelProps {
  resultado: N8nDobleRutaResponse | null;
  pasos: PasoFronterizo[];
  onSelectPaso: (paso: PasoFronterizo) => void;
  onLimpiar: () => void;
  onClose: () => void;
  alternativeIsFocused: boolean;
  onToggleFocus: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getDistanciaKm(ors: OrsResponse): string {
  const distM = ors.features[0]?.properties?.summary?.distance ?? 0;
  return (distM / 1000).toFixed(1);
}

function getDuracion(ors: OrsResponse): string {
  const seg = ors.features[0]?.properties?.summary?.duration ?? 0;
  const hrs = Math.floor(seg / 3600);
  const min = Math.floor((seg % 3600) / 60);
  if (hrs > 0) return `${hrs} h ${min} min`;
  return `${min} min`;
}

/**
 * Extrae el nombre del paso desde el mensaje_natural usando heurística de texto.
 * Si el backend ya envía paso_primario / paso_alternativo, los usa directamente.
 */
function extraerNombrePaso(
  resultado: N8nDobleRutaResponse,
  isAlternative: boolean
): string {
  if (!isAlternative && resultado.mensaje.paso_fronterizo_primario) {
    return resultado.mensaje.paso_fronterizo_primario;
  }
  if (isAlternative && resultado.mensaje.paso_fronterizo_alternativo) {
    return resultado.mensaje.paso_fronterizo_alternativo;
  }

  return '—';
}

// ── Componente ───────────────────────────────────────────────────────────────

export default function ResultadosPanel({
  resultado,
  pasos,
  onSelectPaso,
  onLimpiar,
  onClose,
  alternativeIsFocused,
  onToggleFocus,
}: ResultadosPanelProps) {
  // Para mantener el contenido visible durante la animación de salida
  const [activeResultado, setActiveResultado] = useState<N8nDobleRutaResponse | null>(resultado);

  useEffect(() => {
    if (resultado) {
      setActiveResultado(resultado);
    } else {
      const t = setTimeout(() => setActiveResultado(null), 400);
      return () => clearTimeout(t);
    }
  }, [resultado]);

  const display = resultado || activeResultado;
  if (!display) return null;

  const rutaActiva: OrsResponse = alternativeIsFocused
    ? display.rutaAlternativa
    : display.rutaPrimaria;

  const distancia = getDistanciaKm(rutaActiva);
  const duracion  = getDuracion(rutaActiva);
  const nombrePaso = extraerNombrePaso(display, alternativeIsFocused);

  // Buscar el paso en la lista de pasos del mapa
  const pasoEncontrado = pasos.find(
    (p) => p.nombre.toLowerCase().includes(nombrePaso.toLowerCase().split(' ').pop() ?? '')
  );

  const handleVerPaso = () => {
    if (pasoEncontrado) onSelectPaso(pasoEncontrado);
  };

  const handleExport = () => {
    const origin = display.origenStr || '';
    const destination = display.destinoStr || '';
    const waypoints = nombrePaso || '';
    const url = `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(waypoints)}/${encodeURIComponent(destination)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <aside className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Resultados de Ruta</h2>
          <button onClick={onClose} className={styles.closeButton} title="Cerrar panel">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className={styles.content}>

          {/* B) Puntos de Origen y Destino (reemplaza Análisis de ruta) */}
          <div className={styles.routeHeaderCard}>
            <div className={styles.routePoint}>
              <div className={styles.routeIconWrapper}>
                <MapPin size={16} />
              </div>
              <div className={styles.routeText}>
                <span className={styles.routeLabel}>Origen</span>
                <span className={styles.routeValue}>{display.origenStr || 'Desconocido'}</span>
              </div>
            </div>
            
            <div className={styles.routeDivider}>
              <div className={styles.routeLine} />
              <div className={styles.routeCenterIcon}><Route size={14} /></div>
              <div className={styles.routeLine} />
            </div>

            <div className={styles.routePoint}>
              <div className={styles.routeIconWrapper}>
                <MapPin size={16} />
              </div>
              <div className={styles.routeText}>
                <span className={styles.routeLabel}>Destino</span>
                <span className={styles.routeValue}>{display.destinoStr || 'Desconocido'}</span>
              </div>
            </div>
          </div>

          {/* C) Widgets dinámicos — cambian con alternativeIsFocused */}
          <div>
            <p className={styles.sectionTitle}>
              {alternativeIsFocused ? '📍 Ruta alternativa' : '⭐ Ruta primaria'}
            </p>
            <div className={styles.widgetsGrid}>

              {/* Widget 1 — Distancia */}
              <div className={styles.widget}>
                <div className={styles.widgetIcon}>
                  <Ruler size={18} />
                </div>
                <div className={styles.widgetInfo}>
                  <span className={styles.widgetLabel}>Distancia</span>
                  <span className={styles.widgetValue}>{distancia} km</span>
                </div>
              </div>

              {/* Widget 2 — Tiempo estimado */}
              <div className={styles.widget}>
                <div className={styles.widgetIcon}>
                  <Clock size={18} />
                </div>
                <div className={styles.widgetInfo}>
                  <span className={styles.widgetLabel}>Tiempo estimado</span>
                  <span className={styles.widgetValue}>{duracion}</span>
                </div>
              </div>

              {/* Widget 3 — Paso fronterizo */}
              <div className={styles.widget}>
                <div className={styles.widgetIcon}>
                  <MapPin size={18} />
                </div>
                <div className={styles.pasoWidgetBody}>
                  <div className={styles.pasoInfo}>
                    <span className={styles.widgetLabel}>Paso Fronterizo</span>
                    <span className={styles.widgetValue}>{nombrePaso}</span>
                  </div>
                  {pasoEncontrado && (
                    <button className={styles.pasoVerBtn} onClick={handleVerPaso}>
                      Ver info
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>

          <div className={styles.divider} />

          {/* D) Botones dinámicos */}
          <div className={styles.actionButtons}>
            <button
              className={`${styles.toggleButton} ${alternativeIsFocused ? styles.focused : ''}`}
              onClick={onToggleFocus}
            >
              <ArrowLeftRight size={16} />
              {alternativeIsFocused ? 'Enfocar ruta primaria' : 'Enfocar ruta alternativa'}
            </button>
            <button className={styles.exportButton} onClick={handleExport}>
              <ExternalLink size={16} />
              Exportar Ruta en Maps
            </button>
          </div>

        </div>

        {/* E) Limpiar Ruta — al fondo */}
        <div className={styles.bottomSection}>
          <button className={styles.limpiarButton} onClick={onLimpiar}>
            🗑 Limpiar Ruta
          </button>
        </div>
    </aside>
  );
}
