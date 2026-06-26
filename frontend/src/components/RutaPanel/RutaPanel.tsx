'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Flag, ChevronDown, Navigation, Eye } from 'lucide-react';
import {
  useCalcularRuta,
  type PaisDestino,
  type PaisOrigen,
  type TipoVehiculo,
  type SubtipoCamion,
  type DireccionEstructurada,
} from '@/lib/hooks/useCalcularRuta';
import type { N8nDobleRutaResponse } from '@/lib/types';
import styles from './RutaPanel.module.css';

const PAISES_DESTINO: { value: PaisDestino; label: string; code: string }[] = [
  { value: 'Argentina', label: 'Argentina', code: 'AR' },
  { value: 'Bolivia',   label: 'Bolivia',   code: 'BO' },
  { value: 'Peru',      label: 'Perú',      code: 'PE' },
];

const PAISES_ORIGEN: { value: PaisOrigen; label: string; code: string }[] = [
  { value: 'Chile', label: 'Chile', code: 'CL' },
];

// C3c: Eliminada la opción "General". Autobús es el primero.
const SUBTIPOS: { value: SubtipoCamion; label: string }[] = [
  { value: 'autobus',   label: 'Autobús' },
  { value: 'agricola',  label: 'Agrícola' },
  { value: 'forestal',  label: 'Forestal' },
  { value: 'reparto',   label: 'Reparto' },
  { value: 'mercancia', label: 'Mercancía' },
];

const EMPTY_DIRECCION: DireccionEstructurada = { calle: '', numero: '', comuna: '', ciudad: '' };

interface RutaPanelProps {
  onRutaCalculada: (resultado: N8nDobleRutaResponse | null) => void;
}

export default function RutaPanel({ onRutaCalculada }: RutaPanelProps) {
  const { calcular, limpiar, loading, error, resultado } = useCalcularRuta();

  // ── Estado del formulario ───────────────────────────────────────────────────
  const [paisOrigen, setPaisOrigen] = useState<PaisOrigen>('Chile');
  const [origen, setOrigen]         = useState<DireccionEstructurada>(EMPTY_DIRECCION);
  const [paisDestino, setPaisDestino] = useState<PaisDestino>('Argentina');
  const [destino, setDestino]       = useState<DireccionEstructurada>(EMPTY_DIRECCION);
  const [vehiculo, setVehiculo]     = useState<TipoVehiculo>('coche');
  const [subtipo, setSubtipo]       = useState<SubtipoCamion>('autobus');

  // C6: Estado de "tiene resultado almacenado" para cambiar el botón
  const [hasResult, setHasResult] = useState(false);
  const [storedResult, setStoredResult] = useState<N8nDobleRutaResponse | null>(null);

  // Verificar si el formulario tiene datos suficientes para enviar
  const origenCompleto = origen.calle.trim().length > 0 || origen.ciudad.trim().length > 0;
  const destinoCompleto = destino.calle.trim().length > 0 || destino.ciudad.trim().length > 0;
  const canSubmit = origenCompleto && destinoCompleto && !loading;

  // Sync resultado al padre
  useEffect(() => {
    if (resultado) {
      setHasResult(true);
      setStoredResult(resultado);
    }
    onRutaCalculada(resultado);
  }, [resultado, onRutaCalculada]);

  // C6: cualquier cambio en campos → resetear estado "hasResult"
  const markDirty = useCallback(() => {
    if (hasResult) setHasResult(false);
  }, [hasResult]);

  const updateOrigen = (field: keyof DireccionEstructurada, value: string) => {
    setOrigen(prev => ({ ...prev, [field]: value }));
    markDirty();
  };

  const updateDestino = (field: keyof DireccionEstructurada, value: string) => {
    setDestino(prev => ({ ...prev, [field]: value }));
    markDirty();
  };

  // C6: "Calcular Ruta" → llama n8n. "Revisualizar Ruta" → re-emite resultado sin llamar n8n
  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (hasResult && storedResult) {
      // Revisualizar: re-emite el resultado almacenado
      onRutaCalculada(storedResult);
      return;
    }
    await calcular({
      origen,
      paisOrigen,
      destino,
      paisDestino,
      tipoVehiculo: vehiculo,
      subtipoCamion: vehiculo === 'camion' ? subtipo : undefined,
    });
  };

  return (
    <aside className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Calcular Ruta</h2>
        <p className={styles.subtitle}>{paisOrigen} → {paisDestino}</p>
      </div>

      {/* Form body */}
      <div className={styles.body}>

        {/* ── ORIGEN ─────────────────────────────────────────── */}
        <div className={styles.sectionHeader}>
          <MapPin size={12} className={styles.sectionIcon} />
          <span>ORIGEN</span>
        </div>

        {/* País Origen (C3a) */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>País Origen</label>
          <div className={styles.selectWrapper}>
            <select
              className={styles.select}
              value={paisOrigen}
              onChange={(e) => { setPaisOrigen(e.target.value as PaisOrigen); markDirty(); }}
              disabled={loading}
            >
              {PAISES_ORIGEN.map(({ value, label, code }) => (
                <option key={value} value={value}>{code} {label}</option>
              ))}
            </select>
            <ChevronDown className={styles.selectIcon} size={14} />
          </div>
        </div>

        {/* Calle + Número (C3b) */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup} style={{ flex: 2 }}>
            <label className={styles.label}>Calle</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ej: Avenida O'Higgins"
              value={origen.calle}
              onChange={(e) => updateOrigen('calle', e.target.value)}
              disabled={loading}
            />
          </div>
          <div className={styles.fieldGroup} style={{ flex: 1 }}>
            <label className={styles.label}>Número</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ej: 1234"
              value={origen.numero}
              onChange={(e) => updateOrigen('numero', e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Comuna</label>
          <input
            type="text"
            className={styles.input}
            placeholder="Ej: Talca"
            value={origen.comuna}
            onChange={(e) => updateOrigen('comuna', e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Ciudad</label>
          <input
            type="text"
            className={styles.input}
            placeholder="Ej: Talca"
            value={origen.ciudad}
            onChange={(e) => updateOrigen('ciudad', e.target.value)}
            disabled={loading}
          />
        </div>

        {/* ── DESTINO ─────────────────────────────────────────── */}
        <div className={styles.sectionDivider} />

        <div className={styles.sectionHeader}>
          <Flag size={12} className={styles.sectionIcon} />
          <span>DESTINO</span>
        </div>

        {/* País de destino */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>País Destino</label>
          <div className={styles.selectWrapper}>
            <select
              className={styles.select}
              value={paisDestino}
              onChange={(e) => { setPaisDestino(e.target.value as PaisDestino); markDirty(); }}
              disabled={loading}
            >
              {PAISES_DESTINO.map(({ value, label, code }) => (
                <option key={value} value={value}>{code} {label}</option>
              ))}
            </select>
            <ChevronDown className={styles.selectIcon} size={14} />
          </div>
        </div>

        {/* Calle + Número Destino (C3b) */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup} style={{ flex: 2 }}>
            <label className={styles.label}>Calle</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ej: Av. Corrientes"
              value={destino.calle}
              onChange={(e) => updateDestino('calle', e.target.value)}
              disabled={loading}
            />
          </div>
          <div className={styles.fieldGroup} style={{ flex: 1 }}>
            <label className={styles.label}>Número</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ej: 3247"
              value={destino.numero}
              onChange={(e) => updateDestino('numero', e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Comuna / Barrio</label>
          <input
            type="text"
            className={styles.input}
            placeholder="Ej: San Nicolás"
            value={destino.comuna}
            onChange={(e) => updateDestino('comuna', e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Ciudad</label>
          <input
            type="text"
            className={styles.input}
            placeholder="Ej: Buenos Aires"
            value={destino.ciudad}
            onChange={(e) => updateDestino('ciudad', e.target.value)}
            disabled={loading}
          />
        </div>

        {/* ── VEHÍCULO ─────────────────────────────────────────── */}
        <div className={styles.sectionDivider} />

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
                onClick={() => { setVehiculo(value); markDirty(); }}
                disabled={loading}
              >
                <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Subtipo de camión — condicional. C3c: sin opción "General" */}
        {vehiculo === 'camion' && (
          <div className={`${styles.fieldGroup} ${styles.subtypeSection}`}>
            <label className={styles.label}>Tipo de camión <span style={{ opacity: 0.6, fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={subtipo}
                onChange={(e) => { setSubtipo(e.target.value as SubtipoCamion); markDirty(); }}
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

        {/* C4: Sección "Ruta Calculada" ELIMINADA — los resultados van al panel ResultadosPanel */}

      </div>

      {/* Bottom actions */}
      <div className={styles.bottomSection}>
        {/* C6: Botón dinámico "Calcular Ruta" / "Revisualizar Ruta" */}
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
          ) : hasResult ? (
            <>
              <Eye size={14} />
              Revisualizar Ruta
            </>
          ) : (
            <>
              <Navigation size={14} />
              Calcular Ruta
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
