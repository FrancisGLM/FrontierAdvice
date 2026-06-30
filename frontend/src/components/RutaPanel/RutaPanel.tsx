'use client';

import React, { useEffect, useState } from 'react';
import { useRutaContext } from '@/lib/RutaContext';
import { MapPin, Flag, Car, ChevronDown, ChevronLeft, ChevronRight, Navigation, Check, Truck, Lightbulb, AlertTriangle, Trash2, Route, LocateFixed, Map } from 'lucide-react';
import type { DireccionEstructurada, Pais, TipoVehiculo, SubtipoCamion } from '@/lib/hooks/useCalcularRuta';
import type { N8nDobleRutaResponse } from '@/lib/types';
import { EMPTY_DIRECCION } from '@/lib/RutaContext';
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

type Step = 'origen' | 'destino' | 'vehiculo';
const STEPS: Step[] = ['origen', 'destino', 'vehiculo'];

const STEP_ICONS: Record<Step, React.ReactNode> = {
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
  isOpen: boolean;
  onLimpiarRuta: () => void;
}

export default function RutaPanel({ onRutaCalculada, isOpen, onLimpiarRuta }: RutaPanelProps) {
  const {
    step, setStep,
    paisOrigen, setPaisOrigen,
    origen, setOrigen,
    paisDestino, setPaisDestino,
    destino, setDestino,
    vehiculo, setVehiculo,
    subtipo, setSubtipo,
    isCalculated, setIsCalculated,
    pickingMapFor, setPickingMapFor,
    calcular, loading, error, rutaResultado: resultado
  } = useRutaContext();

  const [mounted, setMounted] = useState(isOpen);
  const [animateOpen, setAnimateOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => setAnimateOpen(true)));
      return () => cancelAnimationFrame(frame);
    } else {
      setAnimateOpen(false);
      const timer = setTimeout(() => setMounted(false), 300); // 300ms match transition
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const stepIndex = STEPS.indexOf(step);

  // Per-step validation
  const origenValido  = paisOrigen !== '' && origen.calle.trim().length > 0 && origen.numero.trim().length > 0 && origen.comuna.trim().length > 0 && origen.ciudad.trim().length > 0;
  const destinoValido = paisDestino !== '' && destino.calle.trim().length > 0 && destino.numero.trim().length > 0 && destino.comuna.trim().length > 0 && destino.ciudad.trim().length > 0;
  const vehiculoValido = vehiculo !== '' && (vehiculo === 'camion' ? subtipo !== '' : true);
  
  const canContinue   = step === 'origen' ? origenValido
                      : step === 'destino' ? destinoValido
                      : vehiculoValido;

  // Clear step logic
  const isStepDirty = () => {
    if (step === 'origen') {
      return paisOrigen !== '' || origen.calle !== '' || origen.numero !== '' || origen.comuna !== '' || origen.ciudad !== '';
    }
    if (step === 'destino') {
      return paisDestino !== '' || destino.calle !== '' || destino.numero !== '' || destino.comuna !== '' || destino.ciudad !== '';
    }
    if (step === 'vehiculo') {
      return vehiculo !== '' || subtipo !== '';
    }
    return false;
  };

  const handleClearStep = () => {
    if (step === 'origen') {
      setPaisOrigen('');
      setOrigen(EMPTY_DIRECCION);
    } else if (step === 'destino') {
      setPaisDestino('');
      setDestino(EMPTY_DIRECCION);
    } else if (step === 'vehiculo') {
      setVehiculo('');
      setSubtipo('');
    }
  };

  // Sync resultado al padre y marcar como calculado
  useEffect(() => {
    if (resultado) {
      setIsCalculated(true);
      onRutaCalculada(resultado);
    }
  }, [resultado, onRutaCalculada]);

  // Si el usuario cambia cualquier campo, se pierde el estado de 'calculado'
  const updateOrigen = (field: keyof DireccionEstructurada, value: string) => {
    setOrigen(prev => ({ ...prev, [field]: value, coordenadasExactas: null }));
    setIsCalculated(false);
  };

  const updateDestino = (field: keyof DireccionEstructurada, value: string) => {
    setDestino(prev => ({ ...prev, [field]: value, coordenadasExactas: null }));
    setIsCalculated(false);
  };

  const [isLocating, setIsLocating] = useState<'origen'|'destino'|null>(null);

  const handleLocateMe = async (target: 'origen' | 'destino') => {
    if (!navigator.geolocation) return;
    setIsLocating(target);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data && data.address) {
          const { road, house_number, city, town, village, state, country } = data.address;
          const street = road || data.name || '';
          const number = house_number || 'S/N';
          const muni = city || town || village || state || '';
          const pais = country || '';

          const dir = {
            calle: street,
            numero: number,
            comuna: muni,
            ciudad: state || muni,
            coordenadasExactas: { lat, lng }
          };

          if (target === 'origen') {
            setOrigen(dir);
            if (['Argentina', 'Bolivia', 'Chile', 'Peru'].includes(pais)) {
               if (pais === paisDestino) {
                 alert('El país de origen no puede ser el mismo que el destino. Se ha borrado el destino.');
                 setPaisDestino('');
               }
               setPaisOrigen(pais as any);
            }
          } else {
            setDestino(dir);
            if (['Argentina', 'Bolivia', 'Chile', 'Peru'].includes(pais)) {
               if (pais === paisOrigen) {
                 alert('El país de destino no puede ser el mismo que el origen. Se ha borrado el origen.');
                 setPaisOrigen('');
               }
               setPaisDestino(pais as any);
            }
          }
        }
      } catch (err) {
        console.error('Error reverse geocoding', err);
      } finally {
        setIsLocating(null);
      }
    }, () => {
      setIsLocating(null);
      alert('No se pudo obtener la ubicación.');
    });
  };

  const handleContinuar = () => {
    if (step === 'origen')  setStep('destino');
    if (step === 'destino') setStep('vehiculo');
  };

  const handleVolver = () => {
    if (step === 'vehiculo') setStep('destino');
    if (step === 'destino')  setStep('origen');
  };

  const handleFinalizar = async () => {
    if (paisOrigen === '' || paisDestino === '' || vehiculo === '') return;
    
    await calcular({
      origen, paisOrigen,
      destino, paisDestino,
      tipoVehiculo: vehiculo,
      subtipoCamion: vehiculo === 'camion' ? (subtipo as SubtipoCamion) : undefined,
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

  if (!mounted) return null;

  return (
    <aside className={`${styles.panel} ${isOpen !== undefined ? (animateOpen ? styles.desktopOpen : styles.desktopClosed) : ''} ${animateOpen ? styles.open : ''}`}>
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
                  onChange={e => {
                    setPaisOrigen(e.target.value as Pais);
                    setIsCalculated(false);
                  }}
                  disabled={loading}
                >
                  <option value="" disabled>Seleccione el país de Origen</option>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} className={styles.sectionIcon} />
                <span>Dirección de Origen</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => handleLocateMe('origen')}
                  className={styles.actionBtn}
                  title="Usar mi ubicación"
                  disabled={isLocating === 'origen' || loading}
                >
                  <LocateFixed size={14} style={{ opacity: isLocating === 'origen' ? 0.5 : 1 }} />
                </button>
                <button 
                  type="button" 
                  onClick={() => setPickingMapFor(pickingMapFor === 'origen' ? null : 'origen')}
                  className={styles.actionBtn}
                  style={{ backgroundColor: pickingMapFor === 'origen' ? 'var(--blue-500-10)' : undefined, color: pickingMapFor === 'origen' ? '#3b82f6' : undefined }}
                  title="Elegir en el mapa"
                  disabled={loading}
                >
                  <Map size={14} />
                </button>
              </div>
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
              <label className={styles.label}>Región</label>
              <input
                type="text" className={styles.input}
                placeholder="Ej: Del Maule"
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
                  onChange={e => {
                    setPaisDestino(e.target.value as Pais);
                    setIsCalculated(false);
                  }}
                  disabled={loading}
                >
                  <option value="" disabled>Seleccione el país de Destino</option>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Flag size={16} className={styles.sectionIcon} />
                <span>Dirección de Destino</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => handleLocateMe('destino')}
                  className={styles.actionBtn}
                  title="Usar mi ubicación"
                  disabled={isLocating === 'destino' || loading}
                >
                  <LocateFixed size={14} style={{ opacity: isLocating === 'destino' ? 0.5 : 1 }} />
                </button>
                <button 
                  type="button" 
                  onClick={() => setPickingMapFor(pickingMapFor === 'destino' ? null : 'destino')}
                  className={styles.actionBtn}
                  style={{ backgroundColor: pickingMapFor === 'destino' ? 'var(--blue-500-10)' : undefined, color: pickingMapFor === 'destino' ? '#3b82f6' : undefined }}
                  title="Elegir en el mapa"
                  disabled={loading}
                >
                  <Map size={14} />
                </button>
              </div>
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
              <label className={styles.label}>Región</label>
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
                ] as { value: TipoVehiculo; label: string; icon: React.ReactNode }[]
              ).map(({ value, label, icon }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.radioCard} ${vehiculo === value ? styles.radioActive : ''}`}
                  onClick={() => {
                    setVehiculo(value);
                    setIsCalculated(false);
                  }}
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
                  Subtipo
                </label>
                <div className={styles.selectWrapper}>
                  <select
                    className={styles.select}
                    value={subtipo}
                    onChange={e => {
                      setSubtipo(e.target.value as SubtipoCamion);
                      setIsCalculated(false);
                    }}
                    disabled={loading}
                  >
                    <option value="" disabled>Seleccione el Subtipo de Camión</option>
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
            <div style={{ width: '84px' }} />
          )}

          {/* Botón Borrar Paso */}
          <button 
             className={`${styles.clearStepButton} ${isStepDirty() ? styles.clearStepActive : ''}`} 
             onClick={handleClearStep} 
             disabled={!isStepDirty() || loading}
             title="Limpiar campos de este paso"
          >
            <Trash2 size={16} />
          </button>

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
          ) : isCalculated ? (
            <button
              className={styles.primaryButton}
              onClick={() => {
                onLimpiarRuta();
              }}
            >
              <Route size={14} />
              Nueva Ruta
            </button>
          ) : (
            <button
              className={styles.primaryButton}
              onClick={handleFinalizar}
              disabled={!canContinue || loading}
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
