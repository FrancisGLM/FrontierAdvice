'use client';

import { useState, useEffect, useMemo } from 'react';
import { TriangleAlert, Zap, TrendingDown, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { STRAPI_URL } from '@/lib/config';

type NivelRiesgo = 'bajo' | 'medio' | 'alto';

interface SenalPredictivaAPI {
  nivelRiesgo: NivelRiesgo;
  horizonteHoras: number;
  motivoResumen: string;
  tipoEvento: string;
  fechaCalculo: string;
  probabilidad: number;
}

interface PasoRiesgo {
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

const riesgoConfig: Record<NivelRiesgo, { label: string; color: string; bg: string; barColor: string }> = {
  bajo: { label: 'Bajo', color: 'var(--status-open)', bg: 'var(--status-open-bg)', barColor: '#10b981' },
  medio: { label: 'Medio', color: 'var(--status-caution)', bg: 'var(--status-caution-bg)', barColor: '#f59e0b' },
  alto: { label: 'Riesgo Alto', color: 'var(--status-closed)', bg: 'var(--status-closed-bg)', barColor: '#ef4444' },
};

const riesgoScore = { alto: 85, medio: 45, bajo: 10 };

function getRiesgo(raw: string | undefined): NivelRiesgo {
  if (!raw) return 'bajo';
  const l = raw.toLowerCase();
  if (l === 'alto' || l === 'medio' || l === 'bajo') return l as NivelRiesgo;
  return 'bajo';
}

function calcTendencia(r24: NivelRiesgo, r72: NivelRiesgo): 'mejorando' | 'estable' | 'empeorando' {
  const score1 = riesgoScore[r24];
  const score3 = riesgoScore[r72];
  if (score3 < score1) return 'mejorando';
  if (score3 > score1) return 'empeorando';
  return 'estable';
}

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
  const [data, setData] = useState<PasoRiesgo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {

        
        const [resPasos, resSenales] = await Promise.all([
          fetch(`${STRAPI_URL}/api/paso-fronterizos?pagination[limit]=100`),
          fetch(`${STRAPI_URL}/api/senal-predictivas?pagination[limit]=500&populate[id_paso][fields][0]=id&sort=fecha_calculo:desc`),
        ]);

        if (!resPasos.ok || !resSenales.ok) throw new Error('Error al obtener datos de Strapi');
        
        const jsonPasos = await resPasos.json();
        const jsonSenales = await resSenales.json();

        // Agrupar señales por paso
        const senalMap = new Map<string, SenalPredictivaAPI[]>();
        for (const s of (jsonSenales.data ?? [])) {
          const pasoId = String(s.id_paso?.id ?? s.id_paso);
          if (pasoId) {
            const currentList = senalMap.get(pasoId) || [];
            if (!currentList.some((existing) => existing.horizonteHoras === s.horizonte_horas)) {
              currentList.push({
                nivelRiesgo: getRiesgo(s.nivel_riesgo),
                horizonteHoras: s.horizonte_horas,
                motivoResumen: s.motivo_resumen ?? '',
                tipoEvento: s.tipo_evento ?? '',
                fechaCalculo: s.fecha_calculo,
                probabilidad: s.probabilidad != null ? Number(s.probabilidad) : 0,
              });
              senalMap.set(pasoId, currentList);
            }
          }
        }

        const mapped: PasoRiesgo[] = [];
        for (const p of jsonPasos.data) {
          const pasoId = String(p.id);
          const senales = senalMap.get(pasoId);
          
          if (senales && senales.length > 0) {
            const s24 = senales.find(s => s.horizonteHoras === 24);
            const s48 = senales.find(s => s.horizonteHoras === 48);
            const s72 = senales.find(s => s.horizonteHoras === 72);

            const r24 = s24 ? s24.nivelRiesgo : 'bajo';
            const r48 = s48 ? s48.nivelRiesgo : 'bajo';
            const r72 = s72 ? s72.nivelRiesgo : 'bajo';

            // Extraer la probabilidad máxima de los próximos días (asumiendo que viene en porcentaje 0-100 o decimal 0-1)
            let maxProb = Math.max(s24?.probabilidad || 0, s48?.probabilidad || 0, s72?.probabilidad || 0);
            if (maxProb <= 1 && maxProb > 0) maxProb = maxProb * 100;

            mapped.push({
              pasoId: pasoId,
              pasoNombre: p.nombre_oficial,
              region: p.region,
              altitud: p.altitud || undefined,
              riesgoManana: r24,
              riesgoPasado: r48,
              riesgoTercero: r72,
              probabilidadCierre: Math.round(maxProb),
              factorPrincipal: s24?.motivoResumen || s48?.motivoResumen || 'Condiciones normales',
              tendencia: calcTendencia(r24, r72),
            });
          }
        }

        setData(mapped.sort((a, b) => b.probabilidadCierre - a.probabilidadCierre));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const q = searchTerm.toLowerCase();
    return data.filter(p => p.pasoNombre.toLowerCase().includes(q) || p.region.toLowerCase().includes(q));
  }, [data, searchTerm]);

  const criticos = filteredData.filter(p => p.probabilidadCierre >= 70);
  const moderados = filteredData.filter(p => p.probabilidadCierre >= 30 && p.probabilidadCierre < 70);
  const estables = filteredData.filter(p => p.probabilidadCierre < 30);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
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
              Señales predictivas IA — próximos 3 días
            </p>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Buscar paso..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.5rem 1rem 0.5rem 2.25rem',
                  borderRadius: '999px',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--bg-solid)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  width: '200px',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
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
        </div>

        {/* Column header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1.5fr 100px 130px 1.5fr 120px',
          padding: '0.5rem 1.5rem', gap: '1rem',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          {[
            { label: 'Paso Fronterizo', align: 'start' },
            { label: 'Prob. Cierre', align: 'start' },
            { label: 'Horizonte (D+1, D+2, D+3)', align: 'center' },
            { label: 'Factor Principal', align: 'start' },
            { label: 'Tendencia', align: 'start' }
          ].map((h, i) => (
            <span key={i} style={{ 
              fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', 
              letterSpacing: '0.05em', color: 'var(--text-secondary)',
              justifySelf: h.align 
            }}>
              {h.label}
            </span>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem 2rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Cargando análisis de riesgo desde Strapi...</p>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
            <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>Error: {error}</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No hay señales predictivas para mostrar.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredData.map((pred) => {
              const barColor = pred.probabilidadCierre >= 70 ? '#ef4444'
                : pred.probabilidadCierre >= 30 ? '#f59e0b' : '#10b981';
              return (
                <div
                  key={pred.pasoId}
                  style={{
                    display: 'grid', gridTemplateColumns: '1.5fr 100px 130px 1.5fr 120px',
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
                        height: '100%', width: `${Math.min(pred.probabilidadCierre, 100)}%`,
                        backgroundColor: barColor, borderRadius: '2px',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>

                  {/* Horizonte */}
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', justifySelf: 'center' }}>
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
        )}
      </div>
    </div>
  );
}
