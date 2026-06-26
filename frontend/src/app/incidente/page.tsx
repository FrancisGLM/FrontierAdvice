'use client';

import { useState, useEffect } from 'react';
import { Bug, MapPin, ChevronDown, CheckCircle2, AlertCircle, Send, X } from 'lucide-react';
import { STRAPI_URL, N8N_WEBHOOK_URL } from '@/lib/config';

const tiposIncidente = [
  'Paso cerrado sin actualización oficial',
  'Información desactualizada',
  'Accidente o emergencia en la vía',
  'Condiciones climáticas no reportadas',
  'Restricción vehicular no reportada',
  'Error en la plataforma',
  'Otro',
];

type FormState = 'idle' | 'sending' | 'success' | 'error';

export default function ReportarIncidentePage() {
  const [paso, setPaso] = useState('');
  const [tipo, setTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [contacto, setContacto] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');

  const [pasosOptions, setPasosOptions] = useState<{id: string, nombre: string}[]>([]);

  useEffect(() => {
    async function fetchPasos() {
      try {
        const res = await fetch(`${STRAPI_URL}/api/paso-fronterizos?pagination[limit]=100`);
        const data = await res.json();
        setPasosOptions(data.data.map((p: any) => ({ id: p.documentId, nombre: p.nombre_oficial })));
      } catch (err) {
        console.error('Error fetching pasos:', err);
      }
    }
    fetchPasos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paso || !tipo || !descripcion) return;
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
      setFormState('error');
    }
  };

  const handleReset = () => {
    setPaso('');
    setTipo('');
    setDescripcion('');
    setContacto('');
    setFormState('idle');
  };

  const canSubmit = paso && tipo && descripcion.length >= 15;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', height: '100vh',
      backgroundColor: 'var(--bg-base)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem 2rem 1.25rem',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Bug size={20} style={{ color: '#ef4444' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Reportar Incidente</h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Ayúdanos a mantener la información actualizada
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '560px' }}>

          {formState === 'success' ? (
            /* Success state */
            <div style={{
              backgroundColor: 'var(--bg-solid)', borderRadius: '1.5rem',
              border: '1px solid var(--border-subtle)', padding: '3rem 2rem',
              textAlign: 'center', boxShadow: 'var(--shadow-md)',
            }}>
              <div style={{
                width: '4rem', height: '4rem', borderRadius: '50%',
                backgroundColor: 'var(--status-open-bg)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
              }}>
                <CheckCircle2 size={32} style={{ color: 'var(--status-open)' }} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                ¡Reporte enviado!
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
                Gracias por tu contribución. El equipo revisará el reporte y actualizará la información del paso fronterizo lo antes posible.
              </p>
              <button
                id="report-nuevo"
                onClick={handleReset}
                style={{
                  padding: '0.75rem 2rem', borderRadius: '0.75rem',
                  backgroundColor: 'var(--nav-active)', color: 'white',
                  border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
                }}
              >
                Enviar otro reporte
              </button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formState === 'error' && (
                <div style={{ backgroundColor: 'var(--status-closed-bg)', color: 'var(--status-closed)', padding: '1rem', borderRadius: '0.75rem', fontSize: '0.875rem', border: '1px solid var(--status-closed)' }}>
                  Ocurrió un error al enviar el reporte. Por favor, verifica tu conexión e intenta nuevamente.
                </div>
              )}

              {/* Info banner */}
              <div style={{
                backgroundColor: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.2)',
                borderRadius: '0.75rem', padding: '0.75rem 1rem',
                display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
              }}>
                <AlertCircle size={16} style={{ color: '#2563eb', flexShrink: 0, marginTop: '0.1rem' }} />
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Los reportes se revisan manualmente. Para emergencias, contacta al <strong style={{ color: 'var(--text-primary)' }}>SAMU 131</strong> o <strong style={{ color: 'var(--text-primary)' }}>Carabineros 133</strong>.
                </p>
              </div>

              {/* Paso selector */}
              <div style={{
                backgroundColor: 'var(--bg-solid)', borderRadius: '1rem',
                border: '1px solid var(--border-subtle)', overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <label style={{
                  display: 'block', padding: '1rem 1.5rem 0.5rem',
                  fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: 'var(--text-secondary)',
                }}>
                  Paso Fronterizo *
                </label>
                <div style={{ position: 'relative', padding: '0 1rem 1rem' }}>
                  <MapPin size={16} style={{
                    position: 'absolute', left: '1.75rem', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)', pointerEvents: 'none',
                  }} />
                  <ChevronDown size={14} style={{
                    position: 'absolute', right: '1.75rem', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)', pointerEvents: 'none',
                  }} />
                  <select
                    id="report-paso"
                    value={paso}
                    onChange={e => setPaso(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '0.625rem 2.25rem',
                      border: '1px solid var(--border-strong)', borderRadius: '0.75rem',
                      backgroundColor: 'var(--bg-base)', color: paso ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.875rem', outline: 'none', appearance: 'none', cursor: 'pointer',
                    }}
                  >
                    <option value="">Seleccionar paso...</option>
                    {pasosOptions.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tipo incidente */}
              <div style={{
                backgroundColor: 'var(--bg-solid)', borderRadius: '1rem',
                border: '1px solid var(--border-subtle)', overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <label style={{
                  display: 'block', padding: '1rem 1.5rem 0.75rem',
                  fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: 'var(--text-secondary)',
                }}>
                  Tipo de Incidente *
                </label>
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
                  padding: '0 1.5rem 1.25rem',
                }}>
                  {tiposIncidente.map(t => (
                    <button
                      key={t}
                      type="button"
                      id={`report-tipo-${t.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => setTipo(t)}
                      style={{
                        padding: '0.375rem 0.875rem', borderRadius: '999px',
                        border: '1px solid',
                        borderColor: tipo === t ? 'var(--nav-active)' : 'var(--border-strong)',
                        backgroundColor: tipo === t ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                        color: tipo === t ? 'var(--nav-active)' : 'var(--text-secondary)',
                        fontSize: '0.8125rem', fontWeight: tipo === t ? 600 : 400,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descripción */}
              <div style={{
                backgroundColor: 'var(--bg-solid)', borderRadius: '1rem',
                border: '1px solid var(--border-subtle)', overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <label style={{
                  display: 'block', padding: '1rem 1.5rem 0.5rem',
                  fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: 'var(--text-secondary)',
                }}>
                  Descripción * <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(mínimo 15 caracteres)</span>
                </label>
                <div style={{ padding: '0 1rem 1rem' }}>
                  <textarea
                    id="report-descripcion"
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    rows={4}
                    placeholder="Describe con detalle lo que observaste: condiciones de la vía, estado del paso, fuente de información..."
                    style={{
                      width: '100%', padding: '0.75rem 1rem',
                      border: '1px solid var(--border-strong)', borderRadius: '0.75rem',
                      backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)',
                      fontSize: '0.875rem', outline: 'none', resize: 'vertical',
                      fontFamily: 'inherit', lineHeight: 1.6,
                    }}
                  />
                  <p style={{
                    fontSize: '0.75rem', color: descripcion.length < 15 && descripcion.length > 0
                      ? 'var(--status-closed)' : 'var(--text-secondary)',
                    marginTop: '0.375rem', textAlign: 'right',
                  }}>
                    {descripcion.length} / 500
                  </p>
                </div>
              </div>

              {/* Contacto opcional */}
              <div style={{
                backgroundColor: 'var(--bg-solid)', borderRadius: '1rem',
                border: '1px solid var(--border-subtle)', padding: '1rem 1.5rem',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <label htmlFor="report-contacto" style={{
                  display: 'block', marginBottom: '0.5rem',
                  fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: 'var(--text-secondary)',
                }}>
                  Correo de contacto <span style={{ fontWeight: 400, textTransform: 'none' }}>(opcional)</span>
                </label>
                <input
                  id="report-contacto"
                  type="email"
                  value={contacto}
                  onChange={e => setContacto(e.target.value)}
                  placeholder="tu@correo.com"
                  style={{
                    width: '100%', padding: '0.625rem 0.875rem',
                    border: '1px solid var(--border-strong)', borderRadius: '0.75rem',
                    backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)',
                    fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Submit */}
              <button
                id="report-submit"
                type="submit"
                disabled={!canSubmit || formState === 'sending'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.875rem', borderRadius: '0.875rem',
                  backgroundColor: canSubmit ? 'var(--nav-active)' : 'var(--border-strong)',
                  color: canSubmit ? 'white' : 'var(--text-secondary)',
                  border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed',
                  fontSize: '0.9375rem', fontWeight: 700,
                  transition: 'all 0.2s', opacity: formState === 'sending' ? 0.7 : 1,
                }}
              >
                {formState === 'sending' ? (
                  <>
                    <div style={{
                      width: '1rem', height: '1rem', border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: 'white', borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Enviar Reporte
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
