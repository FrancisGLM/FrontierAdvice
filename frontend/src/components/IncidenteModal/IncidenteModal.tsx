'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Bug, MapPin, ChevronDown, CheckCircle2, AlertCircle, Send, TriangleAlert } from 'lucide-react';
import { STRAPI_URL, N8N_WEBHOOK_URL } from '@/lib/config';
import styles from './IncidenteModal.module.css';

const tiposIncidente = [
  'Paso cerrado sin actualización',
  'Información desactualizada',
  'Accidente en la vía',
  'Condiciones no reportadas',
  'Restricción vehicular',
  'Error en la plataforma',
  'Otro',
];

type FormState = 'idle' | 'sending' | 'success';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function IncidenteModal({ open, onClose }: Props) {
  const [paso, setPaso] = useState('');
  const [tipo, setTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [contacto, setContacto] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [pasosOptions, setPasosOptions] = useState<{id: string, nombre: string}[]>([]);

  useEffect(() => {
    async function fetchPasos() {
      try {
        const baseUrl = STRAPI_URL.replace(/\/$/, '');
        const res = await fetch(`${baseUrl}/api/paso-fronterizos?pagination[limit]=100`);
        const data = await res.json();
        setPasosOptions((data.data || []).map((p: any) => ({ id: p.documentId, nombre: p.nombre_oficial })));
      } catch (err) {
        console.error('Error fetching pasos:', err);
      }
    }
    fetchPasos();
  }, []);

  useEffect(() => setMounted(true), []);

  // lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setPaso('');
        setTipo('');
        setDescripcion('');
        setContacto('');
        setFormState('idle');
      }, 350);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setFormState('sending');
    try {
      const response = await fetch(`${N8N_WEBHOOK_URL}/public/reportar-incidente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paso_documentId: paso,
          tipo_incidente: tipo,
          descripcion,
          email_contacto: contacto,
        }),
      });
      if (!response.ok) throw new Error('Error al enviar el reporte');
      setFormState('success');
    } catch (err) {
      console.error(err);
      alert('Error al enviar el reporte. Por favor, intenta nuevamente.');
      setFormState('idle');
    }
  };

  const canSubmit = paso && tipo && descripcion.length >= 15;

  if (!mounted) return null;

  const modal = (
    <div
      ref={overlayRef}
      className={`${styles.overlay} ${open ? styles.overlayVisible : ''}`}
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-label="Reportar incidente"
    >
      <div className={`${styles.modal} ${open ? styles.modalVisible : ''}`}>
        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Bug size={18} />
            </div>
            <div>
              <h2 className={styles.headerTitle}>Reportar Incidente</h2>
              <p className={styles.headerSub}>Ayúdanos a mantener la información actualizada</p>
            </div>
          </div>
          <button
            id="incidente-modal-close"
            onClick={onClose}
            className={styles.closeBtn}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>
          {formState === 'success' ? (
            /* ── Success ── */
            <div className={styles.success}>
              <div className={styles.successIcon}>
                <CheckCircle2 size={36} />
              </div>
              <h3 className={styles.successTitle}>¡Reporte enviado!</h3>
              <p className={styles.successDesc}>
                Gracias por contribuir. El equipo revisará el reporte y actualizará el estado del paso lo antes posible.
              </p>
              <button
                id="incidente-nuevo"
                className={styles.btnPrimary}
                onClick={() => {
                  setPaso('');
                  setTipo('');
                  setDescripcion('');
                  setContacto('');
                  setFormState('idle');
                }}
              >
                Enviar otro reporte
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} className={styles.form} noValidate>

              {/* Info banner */}
              <div className={styles.infoBanner}>
                <AlertCircle size={15} className={styles.infoBannerIcon} />
                <p>
                  Para emergencias llama al <strong>SAMU 131</strong> o <strong>Carabineros 133</strong>.
                </p>
              </div>

              {/* Paso */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="im-paso">
                  Paso fronterizo <span className={styles.required}>*</span>
                </label>
                <div className={styles.selectWrapper}>
                  <MapPin size={15} className={styles.selectIconLeft} />
                  <select
                    id="im-paso"
                    value={paso}
                    onChange={e => setPaso(e.target.value)}
                    required
                    className={styles.select}
                    style={{ color: paso ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    <option value="">Seleccionar paso...</option>
                    {pasosOptions.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className={styles.selectIconRight} />
                </div>
              </div>

              {/* Tipo */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Tipo de incidente <span className={styles.required}>*</span>
                </label>
                <div className={styles.chips}>
                  {tiposIncidente.map(t => (
                    <button
                      key={t}
                      type="button"
                      id={`im-tipo-${t.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => setTipo(t)}
                      className={`${styles.chip} ${tipo === t ? styles.chipActive : ''}`}
                    >
                      {tipo === t && <TriangleAlert size={11} />}
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descripción */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="im-desc">
                  Descripción <span className={styles.required}>*</span>
                  <span className={styles.labelHint}> · mínimo 15 caracteres</span>
                </label>
                <textarea
                  id="im-desc"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder="Describe con detalle lo que observaste: condiciones de la vía, estado del paso, fuente..."
                  className={styles.textarea}
                />
                <div className={styles.charCount}>
                  <span style={{
                    color: descripcion.length > 0 && descripcion.length < 15
                      ? 'var(--status-closed)' : 'var(--text-secondary)'
                  }}>
                    {descripcion.length}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}> / 500</span>
                </div>
              </div>

              {/* Contacto opcional */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="im-contacto">
                  Correo de contacto <span className={styles.labelHint}>(opcional)</span>
                </label>
                <input
                  id="im-contacto"
                  type="email"
                  value={contacto}
                  onChange={e => setContacto(e.target.value)}
                  placeholder="tu@correo.com"
                  className={styles.input}
                />
              </div>

              {/* Footer actions */}
              <div className={styles.footer}>
                <button
                  type="button"
                  onClick={onClose}
                  className={styles.btnSecondary}
                >
                  Cancelar
                </button>
                <button
                  id="im-submit"
                  type="submit"
                  disabled={!canSubmit || formState === 'sending'}
                  className={`${styles.btnPrimary} ${!canSubmit ? styles.btnDisabled : ''}`}
                >
                  {formState === 'sending' ? (
                    <>
                      <span className={styles.spinner} />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      Enviar Reporte
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
