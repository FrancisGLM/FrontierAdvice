import { IconoClima, NivelRiesgo } from '@/lib/types';
import styles from './PasoInfo.module.css';

const climaEmoji: Record<IconoClima, string> = {
  sol: '☀️',
  nublado: '⛅',
  lluvia: '🌧️',
  nieve: '🌨️',
  tormenta: '⛈️',
};

const riesgoStyle: Record<NivelRiesgo, { color: string; label: string }> = {
  bajo: { color: 'var(--status-open)', label: 'Riesgo Bajo' },
  medio: { color: 'var(--status-caution)', label: 'Riesgo Medio' },
  alto: { color: 'var(--status-closed)', label: 'Riesgo Alto' },
};

interface PronosticoProps {
  pronostico: { dia: string; icono: IconoClima; riesgo: NivelRiesgo; alerta?: string }[];
}

export default function WeatherForecast({ pronostico }: PronosticoProps) {
  return (
    <div>
      <h3 className={styles.sectionTitle}>Pronóstico próximos 3 días</h3>
      <div className={styles.forecastGrid}>
        {pronostico.map((d) => {
          const rs = riesgoStyle[d.riesgo];
          return (
            <div key={d.dia} className={styles.forecastCard}>
              <p className={styles.forecastDay}>{d.dia}</p>
              <span className={styles.forecastEmoji}>{climaEmoji[d.icono]}</span>
              <p className={styles.forecastRisk} style={{ color: rs.color }}>
                {rs.label}
              </p>
              {d.alerta && (
                <p className={styles.forecastAlert}>{d.alerta}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
