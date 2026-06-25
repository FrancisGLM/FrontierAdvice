'use client';

import { useState, useEffect } from 'react';
import { MapPin, Flag, ChevronDown, Navigation } from 'lucide-react';
import {
  useCalcularRuta,
  type PaisDestino,
  type TipoVehiculo,
  type SubtipoCamion,
} from '@/lib/hooks/useCalcularRuta';
import type { OrsResponse } from '@/lib/types';
import styles from './RutaPanel.module.css';

const PAISES: { value: PaisDestino; label: string; flag: string }[] = [
  { value: 'Argentina', label: 'Argentina', flag: '🇦🇷' },
  { value: 'Bolivia',   label: 'Bolivia',   flag: '🇧🇴' },
  { value: 'Peru',      label: 'Perú',      flag: '🇵🇪' },
];

const SUBTIPOS: { value: SubtipoCamion; label: string }[] = [
  { value: 'general',    label: 'General' },
  { value: 'autobus',    label: 'Autobús' },
  { value: 'agricola',   label: 'Agrícola' },
  { value: 'forestal',   label: 'Forestal' },
  { value: 'reparto',    label: 'Reparto' },
  { value: 'mercancia',  label: 'Mercancía' },
];

interface RutaPanelProps {
  onRutaCalculada: (ruta: OrsResponse | null) => void;
}

function formatDuration(seconds: number): string {
  const min = Math.round(seconds / 60);
  const hrs = Math.floor(min / 60);
  const rem = min % 60;
  return hrs > 0 ? `${hrs} h ${rem} min` : `${min} min`;
}

export default function RutaPanel({ onRutaCalculada }: RutaPanelProps) {
  const { calcular, limpiar, loading, error, ruta } = useCalcularRuta();

  const [origen,        setOrigen]        = useState('');
  const [destino,       setDestino]       = useState('');
  const [pais,          setPais]          = useState<PaisDestino>('Argentina');
  const [vehiculo,      setVehiculo]      = useState<TipoVehiculo>('coche');
  const [subtipo,       setSubtipo]       = useState<SubtipoCamion>('general');

  const canSubmit = origen.trim().length > 0 && destino.trim().length > 0 && !loading;

  // Sync ruta to parent whenever it changes
  useEffect(() => {
    onRutaCalculada(ruta);
  }, [ruta, onRutaCalculada]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await calcular({
      origen:        origen.trim(),
      destino:       destino.trim(),
      paisDestino:   pais,
      tipoVehiculo:  vehiculo,
      subtipoCamion: vehiculo === 'camion' ? subtipo : undefined,
    });
  };

  const handleLimpiar = () => {
    limpiar();
    // onRutaCalculada(null) is called via the useEffect above
  };

  return (
    <aside className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Calcular Ruta</h2>
        <p className={styles.subtitle}>Chile → {pais}</p>
      </div>

      {/* Form body */}
      <div className={styles.body}>

        {/* Origen */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Origen (Chile)</label>
          <div className={styles.inputWrapper}>
            <MapPin className={styles.inputIcon} size={14} />
            <input
              type="text"
              className={styles.input}
              placeholder="Ej: Curicó, Maule"
              value={origen}
              onChange={(e) => setOrigen(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* País de destino */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>País de destino</label>
          <div className={styles.selectWrapper}>
            <select
              className={styles.select}
              value={pais}
              onChange={(e) => setPais(e.target.value as PaisDestino)}
              disabled={loading}
            >
              {PAISES.map(({ value, label, flag }) => (
                <option key={value} value={value}>
                  {flag} {label}
                </option>
              ))}
            </select>
            <ChevronDown className={styles.selectIcon} size={14} />
          </div>
        </div>

        {/* Destino */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Destino</label>
          <div className={styles.inputWrapper}>
            <Flag className={styles.inputIcon} size={14} />
            <input
              type="text"
              className={styles.input}
              placeholder={`Ej: Buenos Aires, ${pais}`}
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Tipo de vehículo */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Tipo de vehículo</label>
          <div className={styles.radioGroup}>
            {(
              [
                { value: 'coche',  label: 'Coche',  icon: '🚗' },
                { value: 'camion', label: 'Camión', icon: '🚛' },
              ] as { value: TipoVehiculo; label: string; icon: string }[]
            ).map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                className={`${styles.radioCard} ${vehiculo === value ? styles.radioActive : ''}`}
                onClick={() => setVehiculo(value)}
                disabled={loading}
              >
                <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Subtipo de camión — condicional */}
        {vehiculo === 'camion' && (
          <div className={`${styles.fieldGroup} ${styles.subtypeSection}`}>
            <label className={styles.label}>Tipo de camión <span style={{ opacity: 0.6, fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={subtipo}
                onChange={(e) => setSubtipo(e.target.value as SubtipoCamion)}
                disabled={loading}
              >
                {SUBTIPOS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown className={styles.selectIcon} size={14} />
            </div>

            {/* Tip informativo */}
            <div className={styles.tipBox}>
              <span className={styles.tipIcon}>💡</span>
              <p className={styles.tipText}>
                Especificar el tipo de camión puede mejorar el cálculo considerando
                restricciones de altura, peso y acceso a ciertas vías.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={styles.errorBox}>
            <span className={styles.errorIcon}>⚠️</span>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}

        {/* Resultado */}
        {ruta && ruta.features.length > 0 && (() => {
          const summary = ruta.features[0].properties.summary;
          const km      = (summary.distance / 1000).toFixed(1);
          const dur     = formatDuration(summary.duration);
          return (
            <div className={styles.summaryCard}>
              <p className={styles.summaryTitle}>✅ Ruta calculada</p>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>🛣 Distancia</span>
                <span className={styles.summaryValue}>{km} km</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>⏱ Duración est.</span>
                <span className={styles.summaryValue}>{dur}</span>
              </div>
            </div>
          );
        })()}

      </div>

      {/* Bottom actions */}
      <div className={styles.bottomSection}>
        <button
          className={styles.primaryButton}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {loading ? (
            <>
              <span className={styles.spinner} />
              Calculando...
            </>
          ) : (
            <>
              <Navigation size={14} />
              Calcular ruta
            </>
          )}
        </button>

        {ruta && (
          <button className={styles.secondaryButton} onClick={handleLimpiar}>
            🗑 Limpiar ruta
          </button>
        )}
      </div>
    </aside>
  );
}
