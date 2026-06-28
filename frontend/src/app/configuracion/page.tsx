'use client';

import { useState, useEffect } from 'react';
import { Settings, Shield, Lock, LogOut, Sun, Moon, Eye } from 'lucide-react';
import { useTheme } from 'next-themes';
import LoginModal from '@/components/LoginModal/LoginModal';
import { useAuth } from '@/lib/AuthContext';

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
  const [loginOpen, setLoginOpen] = useState(false);
  const { isAdmin, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Opciones avanzadas y de administración</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem 6rem' }}>
        <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Acerca de */}
          <Section icon={Shield} title="Acerca de" color="#f59e0b">
            {[
              { label: 'Versión', value: '0.1.0 — Beta' },
              { label: 'Fuentes de datos', value: 'UPF Ministerio, pasosfronterizos.gov.cl, @UPFronterizos' },
              { label: 'Proyecto', value: 'FrontierAdvice' },
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

          {/* Apariencia y Accesibilidad */}
          <Section icon={Eye} title="Apariencia y Accesibilidad" color="#10b981">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Modo de Contraste</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                  Cambia entre colores claros u oscuros para mejorar la visibilidad.
                </p>
              </div>
              <button 
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-base)',
                  color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600, border: '1px solid var(--border-strong)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                {mounted && resolvedTheme === 'dark' ? (
                  <><Sun size={16} /> Modo Claro</>
                ) : (
                  <><Moon size={16} /> Modo Oscuro</>
                )}
              </button>
            </div>
          </Section>

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
