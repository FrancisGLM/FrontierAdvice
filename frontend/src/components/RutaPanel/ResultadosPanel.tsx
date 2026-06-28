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
  isOpen?: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getDistanciaKm(ors: OrsResponse): string {
  const distM = ors.features[0]?.properties?.summary?.distance ?? 0;
  return (distM / 1000).toFixed(1);
}

function getDuracion(ors: OrsResponse): string {
  const segs = ors.features[0]?.properties?.summary?.duration ?? 0;
  const horas = Math.floor(segs / 3600);
  const minutos = Math.floor((segs % 3600) / 60);
  if (horas > 0) {
    return `${horas}h ${minutos}m`;
  }
  return `${minutos} min`;
}

function extraerNombrePaso(r: N8nDobleRutaResponse, isAlternative: boolean): string {
  const ors = isAlternative ? r.rutaAlternativa : r.rutaPrimaria;
  if (!ors.features || ors.features.length === 0) return '—';

  // Buscar el paso en los metadatos de N8N si existe
  if (isAlternative && r.pasoAlternativo) return r.pasoAlternativo;
  if (!isAlternative && r.pasoPrimario) return r.pasoPrimario;

  const steps = ors.features[0]?.properties?.segments?.[0]?.steps;
  if (!steps) return '—';

  // Si no viene explícito, usar heurística sobre las instrucciones (fallback)
  const cruzando = steps.find(s => s.instruction.toLowerCase().includes('complejo fronterizo') || s.instruction.toLowerCase().includes('paso fronterizo'));
  if (cruzando) {
    const nameMatch = cruzando.instruction.match(/(?:Complejo Fronterizo|Paso Fronterizo)\s+([\w\s]+?)(?:,|\.|$)/i);
    if (nameMatch && nameMatch[1]) return nameMatch[1].trim();
  }

  // Buscar en toda la ruta
  const texto = steps.map(s => s.instruction).join(' | ');
  const match = texto.match(/(?:Complejo Fronterizo|Paso Fronterizo)\s+([\w\s]+?)(?:,|\.|$)/i);
  if (match && match[1]) {
    return match[1].trim();
  } else {
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
  isOpen,
}: ResultadosPanelProps) {
  // Para animación de mount (cuando cambia isOpen)
  const [mounted, setMounted] = useState(isOpen ?? true);
  const [animateOpen, setAnimateOpen] = useState(false);

  useEffect(() => {
    if (isOpen === undefined) return;
    if (isOpen) {
      setMounted(true);
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => setAnimateOpen(true)));
      return () => cancelAnimationFrame(frame);
    } else {
      setAnimateOpen(false);
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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
  if ((isOpen !== undefined && !mounted) || !display) return null;

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
    <aside className={`${styles.panel} ${isOpen !== undefined ? (animateOpen ? styles.desktopOpen : styles.desktopClosed) : ''} ${animateOpen ? styles.open : ''}`}>
      {/* ── Header ────────────────────────────────────────────────────────────── */}
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
