'use client';

import { useState, useEffect } from 'react';
import { X, Ruler, Clock, MapPin, ArrowLeftRight } from 'lucide-react';
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
  if (!isAlternative && resultado.mensaje.paso_primario) {
    return resultado.mensaje.paso_primario;
  }
  if (isAlternative && resultado.mensaje.paso_alternativo) {
    return resultado.mensaje.paso_alternativo;
  }

  // Fallback: buscar en el mensaje_natural
  const texto = resultado.mensaje.mensaje_natural ?? '';

  if (!isAlternative) {
    // Primera mención de "Complejo Fronterizo" o "Paso" en el texto
    const match = texto.match(/(?:Complejo Fronterizo|Paso Fronterizo|paso)\s+([\w\s]+?)(?:,|\.|\s+que|\s+en|\s+con)/i);
    return match ? match[0].replace(/,|\.|\s+que.*|en.*|con.*/i, '').trim() : '—';
  } else {
    // Segunda mención: buscar "segunda mejor opción" o "alternativa"
    const match = texto.match(/(?:segunda mejor opci[oó]n|alternativa).*?(?:Complejo Fronterizo|Paso Fronterizo)\s+([\w\s]+?)(?:,|\.|\s)/i);
    if (match) return match[0].replace(/.*(?:Complejo Fronterizo|Paso Fronterizo)\s+/i, '').replace(/,|\.|\s*$/, '').trim();
    // Fallback: segunda ocurrencia de Complejo Fronterizo
    const allMatches = [...texto.matchAll(/(?:Complejo Fronterizo|Paso Fronterizo)\s+[\w\s]+?(?=,|\.)/gi)];
    if (allMatches.length >= 2) return allMatches[1][0].trim();
    return '—';
  }
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

          {/* B) Mensaje natural — no cambia al enfocar */}
          <div className={styles.mensajeCard}>
            <p className={styles.mensajeTitulo}>🤖 Análisis de ruta</p>
            <p className={styles.mensajeTexto}>{display.mensaje.mensaje_natural}</p>
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

          {/* D) Botón toggle enfoque — C8 */}
          <button
            className={`${styles.toggleButton} ${alternativeIsFocused ? styles.focused : ''}`}
            onClick={onToggleFocus}
          >
            <ArrowLeftRight size={14} />
            {alternativeIsFocused ? 'Enfocar ruta primaria' : 'Enfocar ruta alternativa'}
          </button>

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
