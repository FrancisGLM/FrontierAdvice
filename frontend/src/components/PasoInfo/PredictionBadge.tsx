'use client';

import { BrainCircuit, Clock } from 'lucide-react';
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
          if (s.nivelRiesgo === 'Alto') estadoTexto = 'CERRADO';
          if (s.nivelRiesgo === 'Medio') estadoTexto = 'PRECAUCIÓN';

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
              <div className={styles.predGridMotivo}>
                {s.motivoResumen || 'Normal'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
