'use client';

import { useState } from 'react';
import { History, Search, Filter, ChevronDown, TrendingDown, TrendingUp, Minus } from 'lucide-react';

type EstadoHistorial = 'abierto' | 'precaucion' | 'cerrado';

interface RegistroHistorial {
  id: string;
  paso: string;
  region: string;
  fecha: string;
  hora: string;
  estadoAnterior: EstadoHistorial;
  estadoNuevo: EstadoHistorial;
  motivo: string;
}

const mockHistorial: RegistroHistorial[] = [
  { id: 'h1', paso: 'Paso Pehuenche', region: 'Maule', fecha: 'Hoy', hora: '06:30', estadoAnterior: 'precaucion', estadoNuevo: 'cerrado', motivo: 'Acumulación de nieve superior a 80 cm' },
  { id: 'h2', paso: 'Paso Cristo Redentor', region: 'Valparaíso', fecha: 'Hoy', hora: '05:15', estadoAnterior: 'cerrado', estadoNuevo: 'abierto', motivo: 'Reanudación del tránsito tras despeje de vía' },
  { id: 'h3', paso: 'Paso San Francisco', region: 'Atacama', fecha: 'Ayer', hora: '18:00', estadoAnterior: 'abierto', estadoNuevo: 'precaucion', motivo: 'Alerta meteorológica por vientos fuertes' },
  { id: 'h4', paso: 'Paso Agua Negra', region: 'Coquimbo', fecha: 'Ayer', hora: '12:45', estadoAnterior: 'abierto', estadoNuevo: 'precaucion', motivo: 'Pronóstico de nevada para las próximas 6 horas' },
  { id: 'h5', paso: 'Paso Pino Hachado', region: 'La Araucanía', fecha: '03 Jun', hora: '09:00', estadoAnterior: 'cerrado', estadoNuevo: 'abierto', motivo: 'Condiciones climáticas favorables, vía despejada' },
  { id: 'h6', paso: 'Paso Hua Hum', region: 'Los Ríos', fecha: '03 Jun', hora: '07:30', estadoAnterior: 'abierto', estadoNuevo: 'cerrado', motivo: 'Crecida del río, riesgo de inundación' },
  { id: 'h7', paso: 'Paso Jama', region: 'Antofagasta', fecha: '02 Jun', hora: '14:00', estadoAnterior: 'precaucion', estadoNuevo: 'abierto', motivo: 'Levantamiento de alerta de viento Zonda' },
  { id: 'h8', paso: 'Paso Cardenal Samoré', region: 'Los Lagos', fecha: '02 Jun', hora: '11:20', estadoAnterior: 'abierto', estadoNuevo: 'precaucion', motivo: 'Tormenta eléctrica reportada en sector cordillerano' },
  { id: 'h9', paso: 'Paso Mamuil Malal', region: 'La Araucanía', fecha: '01 Jun', hora: '08:00', estadoAnterior: 'cerrado', estadoNuevo: 'abierto', motivo: 'Rehabilitación tras temporal de viento sur' },
  { id: 'h10', paso: 'Paso Vergara', region: 'Aysén', fecha: '01 Jun', hora: '16:30', estadoAnterior: 'abierto', estadoNuevo: 'precaucion', motivo: 'Lluvia intensa con visibilidad reducida' },
];

const estadoStyles: Record<EstadoHistorial, { label: string; color: string; bg: string }> = {
  abierto: { label: 'ABIERTO', color: 'var(--status-open)', bg: 'var(--status-open-bg)' },
  precaucion: { label: 'PRECAUCIÓN', color: 'var(--status-caution)', bg: 'var(--status-caution-bg)' },
  cerrado: { label: 'CERRADO', color: 'var(--status-closed)', bg: 'var(--status-closed-bg)' },
};

function EstadoBadge({ estado }: { estado: EstadoHistorial }) {
  const s = estadoStyles[estado];
  return (
    <span style={{
      backgroundColor: s.bg, color: s.color, fontSize: '0.65rem', fontWeight: 700,
      padding: '2px 8px', borderRadius: '6px', letterSpacing: '0.05em',
    }}>{s.label}</span>
  );
}

function CambioIcon({ anterior, nuevo }: { anterior: EstadoHistorial; nuevo: EstadoHistorial }) {
  const order = { abierto: 0, precaucion: 1, cerrado: 2 };
  const diff = order[nuevo] - order[anterior];
  if (diff > 0) return <TrendingDown size={16} style={{ color: 'var(--status-closed)' }} />;
  if (diff < 0) return <TrendingUp size={16} style={{ color: 'var(--status-open)' }} />;
  return <Minus size={16} style={{ color: 'var(--status-caution)' }} />;
}

export default function HistorialPage() {
  const [search, setSearch] = useState('');
  const [filtroRegion, setFiltroRegion] = useState('Todas');

  const regiones = ['Todas', ...new Set(mockHistorial.map(h => h.region))];

  const filtered = mockHistorial.filter(h => {
    const matchSearch = h.paso.toLowerCase().includes(search.toLowerCase()) ||
      h.motivo.toLowerCase().includes(search.toLowerCase());
    const matchRegion = filtroRegion === 'Todas' || h.region === filtroRegion;
    return matchSearch && matchRegion;
  });

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
            backgroundColor: 'rgba(37, 99, 235, 0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <History size={20} style={{ color: '#2563eb' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Historial de Cambios
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Registro de estados por paso fronterizo
            </p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{
              fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)',
              backgroundColor: 'var(--border-subtle)', padding: '0.25rem 0.75rem',
              borderRadius: '999px',
            }}>
              {filtered.length} registros
            </span>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{
              position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
            }} />
            <input
              id="historial-search"
              type="text"
              placeholder="Buscar paso o motivo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', paddingLeft: '2.25rem', paddingRight: '0.75rem',
                paddingTop: '0.5rem', paddingBottom: '0.5rem',
                border: '1px solid var(--border-strong)', borderRadius: '0.75rem',
                backgroundColor: 'var(--bg-solid)', color: 'var(--text-primary)',
                fontSize: '0.875rem', outline: 'none',
              }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Filter size={16} style={{
              position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-secondary)', pointerEvents: 'none',
            }} />
            <ChevronDown size={14} style={{
              position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-secondary)', pointerEvents: 'none',
            }} />
            <select
              id="historial-region-filter"
              value={filtroRegion}
              onChange={e => setFiltroRegion(e.target.value)}
              style={{
                paddingLeft: '2.25rem', paddingRight: '2rem',
                paddingTop: '0.5rem', paddingBottom: '0.5rem',
                border: '1px solid var(--border-strong)', borderRadius: '0.75rem',
                backgroundColor: 'var(--bg-solid)', color: 'var(--text-primary)',
                fontSize: '0.875rem', outline: 'none', appearance: 'none', cursor: 'pointer',
              }}
            >
              {regiones.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
        <div style={{
          backgroundColor: 'var(--bg-solid)', borderRadius: '1rem',
          border: '1px solid var(--border-subtle)', overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 2fr 1fr 120px 40px',
            gap: '0',
            padding: '0.75rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-glass)',
          }}>
            {['Paso / Región', 'Fecha', 'Motivo', 'Desde → Hasta', 'Tendencia', ''].map((h, i) => (
              <span key={i} style={{
                fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: 'var(--text-secondary)',
              }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((reg, idx) => (
            <div
              key={reg.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 2fr 1fr 120px 40px',
                gap: '0',
                padding: '1rem 1.5rem',
                borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                alignItems: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-glass)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{reg.paso}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{reg.region}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{reg.fecha}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{reg.hora}</p>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', paddingRight: '1rem', lineHeight: 1.4 }}>
                {reg.motivo}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <EstadoBadge estado={reg.estadoAnterior} />
                <EstadoBadge estado={reg.estadoNuevo} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <CambioIcon anterior={reg.estadoAnterior} nuevo={reg.estadoNuevo} />
              </div>
              <div />
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <History size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
              <p style={{ fontSize: '0.875rem' }}>Sin resultados para tu búsqueda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
