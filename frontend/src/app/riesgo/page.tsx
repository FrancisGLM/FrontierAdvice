'use client';

import { TriangleAlert, Zap, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { pasosFronterizos } from '@/lib/mockData';

type NivelRiesgo = 'bajo' | 'medio' | 'alto';

interface SenalPredictiva {
  pasoId: string;
  pasoNombre: string;
  region: string;
  altitud?: number;
  riesgoManana: NivelRiesgo;
  riesgoPasado: NivelRiesgo;
  riesgoTercero: NivelRiesgo;
  probabilidadCierre: number;
  factorPrincipal: string;
  tendencia: 'mejorando' | 'estable' | 'empeorando';
}

const mockPredicciones: SenalPredictiva[] = [
  {
    pasoId: 'pehuenche',
    pasoNombre: 'Paso Pehuenche',
    region: 'Maule',
    altitud: 2553,
    riesgoManana: 'alto',
    riesgoPasado: 'alto',
    riesgoTercero: 'medio',
    probabilidadCierre: 92,
    factorPrincipal: 'Nevada intensa — acumulación prevista de 40-60 cm',
    tendencia: 'mejorando',
  },
  {
    pasoId: 'san-francisco',
    pasoNombre: 'Paso San Francisco',
    region: 'Atacama',
    altitud: 4726,
    riesgoManana: 'alto',
    riesgoPasado: 'medio',
    riesgoTercero: 'bajo',
    probabilidadCierre: 78,
    factorPrincipal: 'Frente de mal tiempo con ráfagas de 80 km/h y nevadas',
    tendencia: 'mejorando',
  },
  {
    pasoId: 'agua-negra',
    pasoNombre: 'Paso Agua Negra',
    region: 'Coquimbo',
    altitud: 4765,
    riesgoManana: 'medio',
    riesgoPasado: 'alto',
    riesgoTercero: 'alto',
    probabilidadCierre: 65,
    factorPrincipal: 'Tormenta invernal sostenida por sistema de baja presión',
    tendencia: 'empeorando',
  },
  {
    pasoId: 'hua-hum',
    pasoNombre: 'Paso Hua Hum',
    region: 'Los Ríos',
    altitud: 659,
    riesgoManana: 'medio',
    riesgoPasado: 'medio',
    riesgoTercero: 'bajo',
    probabilidadCierre: 40,
    factorPrincipal: 'Precipitaciones moderadas y vientos sostenidos',
    tendencia: 'mejorando',
  },
  {
    pasoId: 'cardinal-samore',
    pasoNombre: 'Paso Cardenal Samoré',
    region: 'Los Lagos',
    altitud: 913,
    riesgoManana: 'medio',
    riesgoPasado: 'bajo',
    riesgoTercero: 'bajo',
    probabilidadCierre: 25,
    factorPrincipal: 'Vientos del SW esperados, sin precipitación significativa',
    tendencia: 'estable',
  },
  {
    pasoId: 'cristo-redentor',
    pasoNombre: 'Paso Cristo Redentor',
    region: 'Valparaíso',
    altitud: 3200,
    riesgoManana: 'bajo',
    riesgoPasado: 'medio',
    riesgoTercero: 'alto',
    probabilidadCierre: 15,
    factorPrincipal: 'Condiciones estables a corto plazo, alerta a 3 días',
    tendencia: 'empeorando',
  },
  {
    pasoId: 'jama',
    pasoNombre: 'Paso Jama',
    region: 'Antofagasta',
    altitud: 4200,
    riesgoManana: 'bajo',
    riesgoPasado: 'bajo',
    riesgoTercero: 'bajo',
    probabilidadCierre: 5,
    factorPrincipal: 'Cielos despejados y sin sistemas meteorológicos activos',
    tendencia: 'estable',
  },
];

const riesgoConfig: Record<NivelRiesgo, { label: string; color: string; bg: string; barColor: string }> = {
  bajo: { label: 'Bajo', color: 'var(--status-open)', bg: 'var(--status-open-bg)', barColor: '#10b981' },
  medio: { label: 'Medio', color: 'var(--status-caution)', bg: 'var(--status-caution-bg)', barColor: '#f59e0b' },
  alto: { label: 'Riesgo Alto', color: 'var(--status-closed)', bg: 'var(--status-closed-bg)', barColor: '#ef4444' },
};

function RiesgoPill({ nivel }: { nivel: NivelRiesgo }) {
  const cfg = riesgoConfig[nivel];
  return (
    <span style={{
      backgroundColor: cfg.bg, color: cfg.color,
      fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px',
      borderRadius: '999px', letterSpacing: '0.03em',
    }}>
      {cfg.label}
    </span>
  );
}

function HorizonteCell({ nivel }: { nivel: NivelRiesgo }) {
  const cfg = riesgoConfig[nivel];
  return (
    <div style={{
      width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem',
      backgroundColor: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px solid ${cfg.color}30`,
    }}>
      <span style={{ fontSize: '0.6rem', fontWeight: 800, color: cfg.color, letterSpacing: '0.02em' }}>
        {cfg.label.slice(0, 3).toUpperCase()}
      </span>
    </div>
  );
}

function TendenciaIcon({ t }: { t: 'mejorando' | 'estable' | 'empeorando' }) {
  if (t === 'mejorando') return <CheckCircle2 size={18} style={{ color: 'var(--status-open)' }} />;
  if (t === 'empeorando') return <TrendingDown size={18} style={{ color: 'var(--status-closed)' }} />;
  return <AlertCircle size={18} style={{ color: 'var(--status-caution)' }} />;
}

export default function RiesgoPage() {
  const criticos = mockPredicciones.filter(p => p.probabilidadCierre >= 70);
  const moderados = mockPredicciones.filter(p => p.probabilidadCierre >= 30 && p.probabilidadCierre < 70);
  const estables = mockPredicciones.filter(p => p.probabilidadCierre < 30);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', height: '100vh',
      backgroundColor: 'var(--bg-base)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem 2rem 1rem',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <TriangleAlert size={20} style={{ color: '#ef4444' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Análisis de Riesgo
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Señales predictivas — próximos 3 días · Datos simulados
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            {[
              { label: 'Crítico', count: criticos.length, color: 'var(--status-closed)', bg: 'var(--status-closed-bg)' },
              { label: 'Moderado', count: moderados.length, color: 'var(--status-caution)', bg: 'var(--status-caution-bg)' },
              { label: 'Estable', count: estables.length, color: 'var(--status-open)', bg: 'var(--status-open-bg)' },
            ].map(s => (
              <span key={s.label} style={{
                fontSize: '0.75rem', fontWeight: 700, color: s.color,
                backgroundColor: s.bg, padding: '0.25rem 0.75rem', borderRadius: '999px',
              }}>
                {s.count} {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Column header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1.5fr 100px 130px 1fr 100px',
          padding: '0.5rem 0', gap: '1rem',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          {['Paso Fronterizo', 'Prob. Cierre', 'Horizonte (D+1, D+2, D+3)', 'Factor Principal', 'Tendencia'].map((h, i) => (
            <span key={i} style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              {h}
            </span>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem 2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {mockPredicciones.map((pred) => {
            const barColor = pred.probabilidadCierre >= 70 ? '#ef4444'
              : pred.probabilidadCierre >= 30 ? '#f59e0b' : '#10b981';
            return (
              <div
                key={pred.pasoId}
                style={{
                  display: 'grid', gridTemplateColumns: '1.5fr 100px 130px 1fr 100px',
                  gap: '1rem', alignItems: 'center',
                  backgroundColor: 'var(--bg-solid)', borderRadius: '1rem',
                  padding: '1rem 1.5rem', border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)', transition: 'box-shadow 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}
              >
                {/* Paso info */}
                <div>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.125rem' }}>
                    {pred.pasoNombre}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {pred.region}{pred.altitud ? ` · ${pred.altitud.toLocaleString()} m.s.n.m.` : ''}
                  </p>
                </div>

                {/* Probability bar */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: barColor }}>
                      {pred.probabilidadCierre}%
                    </span>
                  </div>
                  <div style={{ height: '4px', borderRadius: '2px', backgroundColor: 'var(--border-strong)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pred.probabilidadCierre}%`,
                      backgroundColor: barColor, borderRadius: '2px',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>

                {/* Horizonte */}
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>D+1</p>
                    <HorizonteCell nivel={pred.riesgoManana} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>D+2</p>
                    <HorizonteCell nivel={pred.riesgoPasado} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>D+3</p>
                    <HorizonteCell nivel={pred.riesgoTercero} />
                  </div>
                </div>

                {/* Factor */}
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {pred.factorPrincipal}
                </p>

                {/* Tendencia */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TendenciaIcon t={pred.tendencia} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {pred.tendencia}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <p style={{
          textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)',
          marginTop: '2rem', opacity: 0.6,
        }}>
          ⚠️ Datos simulados — la predicción real se conectará a Gemini + WeatherAPI próximamente
        </p>
      </div>
    </div>
  );
}
