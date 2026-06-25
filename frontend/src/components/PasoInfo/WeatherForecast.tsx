import { IconoClima, NivelRiesgo } from '@/lib/types';
import styles from './PasoInfo.module.css';
import WeatherIcon from './WeatherIcon';

// Color de fondo del card según riesgo
const riesgoCardClass: Record<NivelRiesgo, string> = {
  bajo:  styles.forecastCardBajo,
  medio: styles.forecastCardMedio,
  alto:  styles.forecastCardAlto,
};

const riesgoLabel: Record<NivelRiesgo, string> = {
  bajo:  'Riesgo Bajo',
  medio: 'Riesgo Medio',
  alto:  'Riesgo Alto',
};

interface PronosticoProps {
  pronostico: { dia: string; icono: IconoClima; riesgo: NivelRiesgo; alerta?: string }[];
}

export default function WeatherForecast({ pronostico }: PronosticoProps) {
  return (
    <div>
      <h3 className={styles.sectionTitle}>Pronóstico próximos 3 días</h3>
      <div className={styles.forecastGrid}>
        {pronostico.map((d) => (
          <div
            key={d.dia}
            className={`${styles.forecastCard} ${riesgoCardClass[d.riesgo]}`}
          >
            <p className={styles.forecastDay}>{d.dia}</p>
            <WeatherIcon icono={d.icono} size={48} />
            <p className={styles.forecastRisk}>
              {riesgoLabel[d.riesgo]}
            </p>
            {d.alerta && (
              <p className={styles.forecastAlert}>{d.alerta}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
