'use client';

import { useState, useEffect } from 'react';
import { MapPin, Flag, Car, ChevronDown, ChevronLeft, ChevronRight, Navigation, Check, Truck, Lightbulb, AlertTriangle } from 'lucide-react';
import {
  useCalcularRuta,
  type Pais,
  type TipoVehiculo,
  type SubtipoCamion,
  type DireccionEstructurada,
} from '@/lib/hooks/useCalcularRuta';
import type { N8nDobleRutaResponse } from '@/lib/types';
import styles from './RutaPanel.module.css';

const PAISES: { value: Pais; label: string; code: string }[] = [
  { value: 'Argentina', label: 'Argentina', code: 'AR' },
  { value: 'Bolivia',   label: 'Bolivia',   code: 'BO' },
  { value: 'Chile',     label: 'Chile',     code: 'CL' },
  { value: 'Peru',      label: 'Perú',      code: 'PE' },
];

const SUBTIPOS: { value: SubtipoCamion; label: string }[] = [
  { value: 'autobus',   label: 'Autobús' },
  { value: 'agricola',  label: 'Agrícola' },
  { value: 'forestal',  label: 'Forestal' },
  { value: 'reparto',   label: 'Reparto' },
  { value: 'mercancia', label: 'Mercancía' },
];

const EMPTY_DIRECCION: DireccionEstructurada = { calle: '', numero: '', comuna: '', ciudad: '' };

type Step = 'origen' | 'destino' | 'vehiculo';
const STEPS: Step[] = ['origen', 'destino', 'vehiculo'];

const STEP_ICONS: Record<Step, JSX.Element> = {
  origen:   <MapPin size={16} />,
  destino:  <Flag size={16} />,
  vehiculo: <Car size={16} />,
};

const STEP_LABELS: Record<Step, string> = {
  origen:   'Origen',
  destino:  'Destino',
  vehiculo: 'Vehículo',
};

interface RutaPanelProps {
  onRutaCalculada: (resultado: N8nDobleRutaResponse | null) => void;
}

export default function RutaPanel({ onRutaCalculada }: RutaPanelProps) {
  const { calcular, loading, error, resultado } = useCalcularRuta();

  const [step, setStep] = useState<Step>('origen');

  // ── Form state ──────────────────────────────────────────────────────────────
  const [paisOrigen, setPaisOrigen] = useState<Pais>('Chile');
  const [origen, setOrigen]         = useState<DireccionEstructurada>(EMPTY_DIRECCION);
  const [paisDestino, setPaisDestino] = useState<Pais>('Argentina');
  const [destino, setDestino]       = useState<DireccionEstructurada>(EMPTY_DIRECCION);
  const [vehiculo, setVehiculo]     = useState<TipoVehiculo>('coche');
  const [subtipo, setSubtipo]       = useState<SubtipoCamion>('autobus');

  const stepIndex = STEPS.indexOf(step);

  // Per-step validation
  const origenValido  = origen.calle.trim().length > 0 || origen.ciudad.trim().length > 0;
  const destinoValido = destino.calle.trim().length > 0 || destino.ciudad.trim().length > 0;
  const canContinue   = step === 'origen' ? origenValido
                      : step === 'destino' ? destinoValido
                      : true;

  // Sync resultado al padre
  useEffect(() => {
    if (resultado) {
      onRutaCalculada(resultado);
    }
  }, [resultado, onRutaCalculada]);

  const updateOrigen = (field: keyof DireccionEstructurada, value: string) =>
    setOrigen(prev => ({ ...prev, [field]: value }));

  const updateDestino = (field: keyof DireccionEstructurada, value: string) =>
    setDestino(prev => ({ ...prev, [field]: value }));

  const handleContinuar = () => {
    if (step === 'origen')  setStep('destino');
    if (step === 'destino') setStep('vehiculo');
  };

  const handleVolver = () => {
    if (step === 'vehiculo') setStep('destino');
    if (step === 'destino')  setStep('origen');
  };

  const handleFinalizar = async () => {
    await calcular({
      origen, paisOrigen,
      destino, paisDestino,
      tipoVehiculo: vehiculo,
      subtipoCamion: vehiculo === 'camion' ? subtipo : undefined,
    });
  };

  // Mini summary for step 3
  const origenStr = [
    [origen.calle, origen.numero].filter(Boolean).join(' '),
    origen.ciudad,
  ].filter(Boolean).join(', ') || '—';

  const destinoStr = [
    [destino.calle, destino.numero].filter(Boolean).join(' '),
    destino.ciudad,
  ].filter(Boolean).join(', ') || '—';

  return (
    <aside className={styles.panel}>
      {/* ── Header con step bar ─────────────────────────────── */}
      <div className={styles.header}>
        <h2 className={styles.title}>Calcular Ruta</h2>

        {/* Step progress bar */}
        <div className={styles.stepBar}>
          {STEPS.map((s, i) => (
            <div key={s} className={styles.stepItem}>
              <div
                className={[
                  styles.stepDot,
                  s === step ? styles.stepActive : '',
                  i < stepIndex ? styles.stepDone : '',
                ].join(' ')}
              >
                {i < stepIndex ? <Check size={16} /> : STEP_ICONS[s]}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`${styles.stepConnector} ${i < stepIndex ? styles.stepConnectorDone : ''}`} />
              )}
            </div>
          ))}
        </div>

        <p className={styles.subtitle}>
          Paso {stepIndex + 1} de {STEPS.length} — <strong>{STEP_LABELS[step]}</strong>
        </p>
      </div>

      {/* ── Cuerpo del paso (animado al cambiar) ─────────────── */}
      <div className={styles.body} key={step}>

        {/* ══ PASO 1: ORIGEN ══════════════════════════════════ */}
        {step === 'origen' && (
          <>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>País de Origen</label>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.select}
                  value={paisOrigen}
                  onChange={e => setPaisOrigen(e.target.value as Pais)}
                  disabled={loading}
                >
                  {PAISES.map(({ value, label, code }) => (
                    <option key={value} value={value} disabled={value === paisDestino}>
                      {code} — {label}
                    </option>
                  ))}
                </select>
                <ChevronDown className={styles.selectIcon} size={14} />
              </div>
            </div>

            <div className={styles.sectionDivider} />

            <div className={styles.sectionHeader}>
              <MapPin size={16} className={styles.sectionIcon} />
              <span>Dirección de Origen</span>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup} style={{ flex: 2 }}>
                <label className={styles.label}>Calle</label>
                <input
                  type="text" className={styles.input}
                  placeholder="Ej: Av. O'Higgins"
                  value={origen.calle}
                  onChange={e => updateOrigen('calle', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className={styles.fieldGroup} style={{ flex: 1 }}>
                <label className={styles.label}>N°</label>
                <input
                  type="text" className={styles.input}
                  placeholder="1234"
                  value={origen.numero}
                  onChange={e => updateOrigen('numero', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Comuna</label>
              <input
                type="text" className={styles.input}
                placeholder="Ej: Talca"
                value={origen.comuna}
                onChange={e => updateOrigen('comuna', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Ciudad</label>
              <input
                type="text" className={styles.input}
                placeholder="Ej: Talca"
                value={origen.ciudad}
                onChange={e => updateOrigen('ciudad', e.target.value)}
                disabled={loading}
              />
            </div>
          </>
        )}

        {/* ══ PASO 2: DESTINO ══════════════════════════════════ */}
        {step === 'destino' && (
          <>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>País de Destino</label>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.select}
                  value={paisDestino}
                  onChange={e => setPaisDestino(e.target.value as Pais)}
                  disabled={loading}
                >
                  {PAISES.map(({ value, label, code }) => (
                    <option key={value} value={value} disabled={value === paisOrigen}>
                      {code} — {label}
                    </option>
                  ))}
                </select>
                <ChevronDown className={styles.selectIcon} size={14} />
              </div>
            </div>

            <div className={styles.sectionDivider} />

            <div className={styles.sectionHeader}>
              <Flag size={16} className={styles.sectionIcon} />
              <span>Dirección de Destino</span>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup} style={{ flex: 2 }}>
                <label className={styles.label}>Calle</label>
                <input
                  type="text" className={styles.input}
                  placeholder="Ej: Av. Corrientes"
                  value={destino.calle}
                  onChange={e => updateDestino('calle', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className={styles.fieldGroup} style={{ flex: 1 }}>
                <label className={styles.label}>N°</label>
                <input
                  type="text" className={styles.input}
                  placeholder="3247"
                  value={destino.numero}
                  onChange={e => updateDestino('numero', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Comuna / Barrio</label>
              <input
                type="text" className={styles.input}
                placeholder="Ej: San Nicolás"
                value={destino.comuna}
                onChange={e => updateDestino('comuna', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Ciudad</label>
              <input
                type="text" className={styles.input}
                placeholder="Ej: Buenos Aires"
                value={destino.ciudad}
                onChange={e => updateDestino('ciudad', e.target.value)}
                disabled={loading}
              />
            </div>
          </>
        )}

        {/* ══ PASO 3: VEHÍCULO ═════════════════════════════════ */}
        {step === 'vehiculo' && (
          <>
            <div className={styles.sectionHeader}>
              <Car size={16} className={styles.sectionIcon} />
              <span>Tipo de Vehículo</span>
            </div>

            <div className={styles.radioGroup}>
              {(
                [
                  { value: 'coche',  label: 'Coche',  icon: <Car size={24} /> },
                  { value: 'camion', label: 'Camión', icon: <Truck size={24} /> },
                ] as { value: TipoVehiculo; label: string; icon: JSX.Element }[]
              ).map(({ value, label, icon }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.radioCard} ${vehiculo === value ? styles.radioActive : ''}`}
                  onClick={() => setVehiculo(value)}
                  disabled={loading}
                >
                  <span style={{ color: vehiculo === value ? 'var(--nav-active)' : 'var(--text-secondary)', display: 'flex', justifyContent: 'center' }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {vehiculo === 'camion' && (
              <div className={`${styles.fieldGroup} ${styles.subtypeSection}`}>
                <label className={styles.label}>
                  Subtipo{' '}
                  <span style={{ opacity: 0.6, fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>
                    (opcional)
                  </span>
                </label>
                <div className={styles.selectWrapper}>
                  <select
                    className={styles.select}
                    value={subtipo}
                    onChange={e => setSubtipo(e.target.value as SubtipoCamion)}
                    disabled={loading}
                  >
                    {SUBTIPOS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown className={styles.selectIcon} size={14} />
                </div>
                <div className={styles.tipBox}>
                  <span className={styles.tipIcon}><Lightbulb size={16} /></span>
                  <p className={styles.tipText}>
                    Especificar el tipo mejora el cálculo considerando restricciones de altura, peso y acceso a ciertas vías.
                  </p>
                </div>
              </div>
            )}

            {/* Resumen de ruta configurada */}
            <div className={styles.routeSummaryMini}>
              <div className={styles.routeSummaryRow}>
                <MapPin size={11} style={{ color: 'var(--nav-active)', flexShrink: 0 }} />
                <span><strong>Origen:</strong> {origenStr}</span>
              </div>
              <div className={styles.routeSummaryRow}>
                <Flag size={11} style={{ color: '#10b981', flexShrink: 0 }} />
                <span><strong>Destino:</strong> {destinoStr}</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className={styles.errorBox}>
                <span className={styles.errorIcon}><AlertTriangle size={16} /></span>
                <p className={styles.errorText}>{error}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Botones de navegación ─────────────────────────────── */}
      <div className={styles.bottomSection}>
        <div className={styles.buttonRow}>
          {/* Volver — oculto en paso 1 */}
          {step !== 'origen' ? (
            <button className={styles.backButton} onClick={handleVolver} disabled={loading}>
              <ChevronLeft size={14} />
              Volver
            </button>
          ) : (
            <div />
          )}

          {/* Continuar / Finalizar */}
          {step !== 'vehiculo' ? (
            <button
              className={styles.primaryButton}
              onClick={handleContinuar}
              disabled={!canContinue}
            >
              Continuar
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              className={styles.primaryButton}
              onClick={handleFinalizar}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Calculando...
                </>
              ) : (
                <>
                  <Navigation size={14} />
                  Finalizar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
