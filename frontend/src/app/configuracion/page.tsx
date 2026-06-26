'use client';

import { useState } from 'react';
import { Settings, Bell, Map, Globe, Shield, Lock, LogOut } from 'lucide-react';
import LoginModal from '@/components/LoginModal/LoginModal';
import { useAuth } from '@/lib/AuthContext';

interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}

function Toggle({ id, checked, onChange, label, description }: ToggleProps) {
  return (
    <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer' }}>
      <div>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</p>
        {description && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>{description}</p>}
      </div>
      <div
        id={id}
        onClick={() => onChange(!checked)}
        style={{
          width: '2.75rem', height: '1.5rem', borderRadius: '999px', cursor: 'pointer',
          backgroundColor: checked ? 'var(--nav-active)' : 'var(--border-strong)',
          position: 'relative', flexShrink: 0, transition: 'background 0.2s',
        }}
      >
        <div style={{
          position: 'absolute', top: '2px',
          left: checked ? 'calc(100% - 1.25rem - 2px)' : '2px',
          width: '1.25rem', height: '1.25rem', borderRadius: '50%',
          backgroundColor: 'white', transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }} />
      </div>
    </label>
  );
}

function Section({ icon: Icon, title, children, color }: {
  icon: React.ElementType; title: string; children: React.ReactNode; color: string;
}) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-solid)', borderRadius: '1rem',
      border: '1px solid var(--border-subtle)', overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-glass)',
      }}>
        <div style={{
          width: '2rem', height: '2rem', borderRadius: '0.5rem',
          backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} style={{ color: 'white' }} />
        </div>
        <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {children}
      </div>
    </div>
  );
}

export default function ConfiguracionPage() {
  const [notifCierre, setNotifCierre] = useState(true);
  const [notifPrecaucion, setNotifPrecaucion] = useState(true);
  const [notifApertura, setNotifApertura] = useState(false);
  const [notifRiesgo, setNotifRiesgo] = useState(true);
  const [mapaOscuro, setMapaOscuro] = useState(false);
  const [mostrarAltitud, setMostrarAltitud] = useState(true);
  const [mostrarRegion, setMostrarRegion] = useState(true);
  const [idioma, setIdioma] = useState('es');
  const [actualizacion, setActualizacion] = useState('2');
  const [loginOpen, setLoginOpen] = useState(false);
  const { isAdmin, logout } = useAuth();

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
            backgroundColor: 'rgba(99, 102, 241, 0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Settings size={20} style={{ color: '#6366f1' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Configuración</h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Personaliza tu experiencia en FrontierAdvice</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem 2rem' }}>
        <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Notificaciones */}
          <Section icon={Bell} title="Notificaciones" color="#ef4444">
            <Toggle id="notif-cierre" checked={notifCierre} onChange={setNotifCierre}
              label="Alertas de cierre" description="Recibir aviso cuando un paso se cierre" />
            <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />
            <Toggle id="notif-precaucion" checked={notifPrecaucion} onChange={setNotifPrecaucion}
              label="Alertas de precaución" description="Recibir aviso cuando un paso entre en estado de precaución" />
            <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />
            <Toggle id="notif-apertura" checked={notifApertura} onChange={setNotifApertura}
              label="Alertas de apertura" description="Recibir aviso cuando un paso vuelva a abrir" />
            <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />
            <Toggle id="notif-riesgo" checked={notifRiesgo} onChange={setNotifRiesgo}
              label="Alertas de riesgo predictivo" description="Avisos sobre señales de riesgo alto para los próximos 3 días" />
          </Section>

          {/* Mapa */}
          <Section icon={Map} title="Mapa" color="#2563eb">
            <Toggle id="mapa-oscuro" checked={mapaOscuro} onChange={setMapaOscuro}
              label="Mapa en modo oscuro" description="Usar estilo de mapa oscuro (independiente del tema de la app)" />
            <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />
            <Toggle id="mapa-altitud" checked={mostrarAltitud} onChange={setMostrarAltitud}
              label="Mostrar altitud en marcadores" description="Ver la altitud m.s.n.m. en el popup de cada paso" />
            <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />
            <Toggle id="mapa-region" checked={mostrarRegion} onChange={setMostrarRegion}
              label="Mostrar región en marcadores" description="Ver la región administrativa en el popup de cada paso" />
          </Section>

          {/* General */}
          <Section icon={Globe} title="General" color="#10b981">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Idioma</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>Idioma de la interfaz</p>
              </div>
              <select
                id="config-idioma"
                value={idioma}
                onChange={e => setIdioma(e.target.value)}
                style={{
                  padding: '0.375rem 0.75rem', borderRadius: '0.5rem',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)',
                  fontSize: '0.875rem', outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
            <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Intervalo de actualización</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>Con qué frecuencia se refrescan los datos</p>
              </div>
              <select
                id="config-actualizacion"
                value={actualizacion}
                onChange={e => setActualizacion(e.target.value)}
                style={{
                  padding: '0.375rem 0.75rem', borderRadius: '0.5rem',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)',
                  fontSize: '0.875rem', outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="1">Cada 1 hora</option>
                <option value="2">Cada 2 horas</option>
                <option value="6">Cada 6 horas</option>
                <option value="12">Cada 12 horas</option>
              </select>
            </div>
          </Section>

          {/* Acerca de */}
          <Section icon={Shield} title="Acerca de" color="#f59e0b">
            {[
              { label: 'Versión', value: '0.1.0 — Beta' },
              { label: 'Fuentes de datos', value: 'UPF Ministerio, pasosfronterizos.gov.cl, @UPFronterizos' },
              { label: 'Proyecto', value: 'Proyecto de Título — Ingeniería Civil Informática, UCM 2026' },
              { label: 'Autores', value: 'Francisco López · Franco Ingravallo' },
            ].map((item, i, arr) => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.label}</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '300px' }}>{item.value}</p>
                </div>
                {i < arr.length - 1 && <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', marginTop: '1rem' }} />}
              </div>
            ))}
          </Section>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.5, marginTop: '0.5rem' }}>
            Las preferencias se guardarán localmente — próximamente sincronización de cuenta
          </p>

          {/* Administración */}
          <Section icon={Lock} title="Administración" color="#6366f1">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Acceso a Panel</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                  {isAdmin ? 'Sesión iniciada como administrador' : 'Inicia sesión para opciones avanzadas'}
                </p>
              </div>
              {isAdmin ? (
                <button 
                  onClick={logout}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444', fontSize: '0.875rem', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.2)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}
                >
                  <LogOut size={16} /> Cerrar Sesión
                </button>
              ) : (
                <button 
                  onClick={() => setLoginOpen(true)}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-base)',
                    color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600, border: '1px solid var(--border-strong)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}
                >
                  <Lock size={16} /> Acceder
                </button>
              )}
            </div>
          </Section>

        </div>
      </div>

      <LoginModal 
        open={loginOpen} 
        onClose={() => setLoginOpen(false)} 
      />
    </div>
  );
}
