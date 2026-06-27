'use client';

import { 
  BrainCircuit, Clock, Snowflake, CloudRain, Wind, 
  CloudLightning, History, AlertTriangle, Mountain, 
  Construction, FileWarning, Check, ThermometerSnowflake, 
  Droplets, Tornado, Thermometer, CloudFog, CloudSnow, 
  Droplet, CloudHail, ShieldAlert, Siren
} from 'lucide-react';
import { SenalPredictiva } from '@/lib/types';
import styles from './PasoInfo.module.css';

interface PredictionBadgeProps {
  senales: SenalPredictiva[];
}

const riesgoConfig = {
  Alto: {
    color: 'var(--status-closed)',
    bg: 'var(--status-closed-bg)',
    border: 'rgba(239, 68, 68, 0.28)',
    bgLight: 'rgba(239, 68, 68, 0.09)',
  },
  Medio: {
    color: 'var(--status-caution)',
    bg: 'var(--status-caution-bg)',
    border: 'rgba(234, 179, 8, 0.28)',
    bgLight: 'rgba(234, 179, 8, 0.09)',
  },
  Bajo: {
    color: 'var(--status-open)',
    bg: 'var(--status-open-bg)',
    border: 'rgba(34, 197, 94, 0.28)',
    bgLight: 'rgba(34, 197, 94, 0.09)',
  },
};

const MOTIVO_MATCHERS = [
  // Wind
  { regex: /viento anormalmente/i, icon: AlertTriangle, color: '#f43f5e' }, // rose-500
  { regex: /viento extremo/i, icon: Tornado, color: '#be123c' }, // rose-700
  { regex: /viento muy fuerte/i, icon: Wind, color: '#f43f5e' }, // rose-500
  { regex: /viento fuerte/i, icon: Wind, color: '#fb923c' }, // orange-400
  { regex: /viento moderado/i, icon: Wind, color: '#94a3b8' }, // slate-400
  { regex: /viento/i, icon: Wind, color: '#94a3b8' },

  // Temperature Anomalies
  { regex: /anormalmente baja/i, icon: AlertTriangle, color: '#a855f7' }, // purple-500
  { regex: /significativamente bajo/i, icon: ThermometerSnowflake, color: '#8b5cf6' }, // violet-500
  { regex: /bajo lo normal/i, icon: ThermometerSnowflake, color: '#c084fc' }, // purple-400
  
  // Cold Weather
  { regex: /frío extremo/i, icon: ThermometerSnowflake, color: '#06b6d4' }, // cyan-500
  { regex: /temperatura muy baja/i, icon: Snowflake, color: '#0ea5e9' }, // sky-500
  { regex: /bajo cero/i, icon: Snowflake, color: '#3b82f6' }, // blue-500
  { regex: /cercana a cero/i, icon: Thermometer, color: '#60a5fa' }, // blue-400

  // WMO Snow/Fog
  { regex: /niebla/i, icon: CloudFog, color: '#94a3b8' },
  { regex: /engelante/i, icon: CloudSnow, color: '#818cf8' },
  { regex: /nieve intensa|nevada intensa/i, icon: CloudSnow, color: '#6366f1' },
  { regex: /nieve|nevada/i, icon: Snowflake, color: '#93c5fd' },

  // Rain Anomalies
  { regex: /precipitación anormalmente/i, icon: AlertTriangle, color: '#2563eb' },
  { regex: /precipitación significativamente/i, icon: Droplets, color: '#3b82f6' },
  { regex: /precipitación sobre/i, icon: Droplet, color: '#60a5fa' },
  
  // Rain
  { regex: /muy alta|muy intensa/i, icon: Droplets, color: '#1d4ed8' }, // blue-700
  { regex: /alta|intensa/i, icon: Droplet, color: '#2563eb' }, // blue-600
  { regex: /moderada/i, icon: CloudRain, color: '#3b82f6' }, // blue-500
  { regex: /leve|lluvia/i, icon: CloudRain, color: '#7dd3fc' }, // sky-300

  // Storms
  { regex: /tormenta severa/i, icon: Siren, color: '#b45309' }, // amber-700
  { regex: /granizo/i, icon: CloudHail, color: '#d97706' }, // amber-600
  { regex: /tormenta/i, icon: CloudLightning, color: '#eab308' }, // yellow-500

  // History & Structural
  { regex: /estructural|estacional|temporada/i, icon: Construction, color: '#dc2626' }, // red-600
  { regex: /cierre|cerrado/i, icon: History, color: '#ef4444' }, // red-500
  { regex: /precaución/i, icon: ShieldAlert, color: '#f59e0b' }, // amber-500

  // Risk / Alert
  { regex: /alerta de nivel alto/i, icon: Siren, color: '#ef4444' }, // red-500
  { regex: /alerta/i, icon: AlertTriangle, color: '#f97316' }, // orange-500
  { regex: /riesgo estacional histórico/i, icon: AlertTriangle, color: '#c2410c' },
  { regex: /riesgo estacional/i, icon: AlertTriangle, color: '#ea580c' },
  
  // Context
  { regex: /alta montaña|3000/i, icon: Mountain, color: '#475569' }, // slate-600
  { regex: /montaña/i, icon: Mountain, color: '#64748b' } // slate-500
];

function getMotivoIcon(motivo: string) {
  for (const matcher of MOTIVO_MATCHERS) {
    if (matcher.regex.test(motivo)) {
      const Icon = matcher.icon;
      return <Icon size={20} color={matcher.color} />;
    }
  }
  return <FileWarning size={20} color="var(--text-secondary)" />;
}

export default function PredictionBadge({ senales }: PredictionBadgeProps) {
  if (!senales || senales.length === 0) return null;

  return (
    <div className={styles.predContainer}>
      <div className={styles.predHeaderContainer}>
        <div className={styles.predHeaderLeft}>
          <BrainCircuit size={15} className={styles.predBrainIcon} />
          <span className={styles.predTitle}>Predicción Estado</span>
        </div>
        <div className={styles.predMetaFooterInline}>
          <Clock size={11} />
          <span>{new Date(senales[0].fechaCalculo).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div className={styles.predGrid}>
        {senales.slice(0, 3).map((s, idx) => {
          const cfg = riesgoConfig[s.nivelRiesgo] ?? riesgoConfig['Medio'];
          
          let estadoTexto = 'ABIERTO';
          
          if (s.nivelRiesgo === 'Alto') {
            estadoTexto = 'CERRADO';
          }
          if (s.nivelRiesgo === 'Medio') {
            estadoTexto = 'PRECAUC.';
          }

          return (
            <div 
              key={idx} 
              className={styles.predGridCard} 
              style={{ backgroundColor: cfg.bgLight, borderColor: cfg.border }}
            >
              <div className={styles.predGridTime}>{s.horizonteHoras}h</div>
              <div className={styles.predGridStatus} style={{ color: cfg.color }}>
                {estadoTexto}
              </div>
              <div className={styles.predGridMotivo} style={{ marginTop: '0.25rem' }}>
                {s.motivoResumen && s.motivoResumen !== 'sin señales relevantes' ? (
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {s.motivoResumen.split(',').map((motivoStr, i) => (
                      <span key={i} title={motivoStr.trim()} style={{ display: 'inline-block', cursor: 'help' }}>
                        {getMotivoIcon(motivoStr.trim())}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center', color: 'var(--status-open)' }}>
                    <Check size={20} /> Normal
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
