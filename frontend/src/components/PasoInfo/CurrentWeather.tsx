import { ClimaActual, IconoClima } from '@/lib/types';
import { Wind, Droplets, Eye, Gauge } from 'lucide-react';
import styles from './PasoInfo.module.css';

const climaEmoji: Record<IconoClima, string> = {
  sol: '☀️',
  nublado: '⛅',
  lluvia: '🌧️',
  nieve: '🌨️',
  tormenta: '⛈️',
};

interface CurrentWeatherProps {
  clima: ClimaActual;
}

export default function CurrentWeather({ clima }: CurrentWeatherProps) {
  return (
    <div className={styles.currentWeatherCard}>
      <h3 className={styles.sectionTitle}>Clima actual</h3>

      {/* Main temp row */}
      <div className={styles.cwMainRow}>
        <span className={styles.cwEmoji}>{climaEmoji[clima.icono]}</span>
        <div className={styles.cwTempBlock}>
          <span className={styles.cwTemp}>{clima.temperatura}°C</span>
          <span className={styles.cwDesc}>{clima.descripcion}</span>
          <span className={styles.cwSensacion}>
            Sensación: {clima.sensacionTermica}°C
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className={styles.cwGrid}>
        <div className={styles.cwStat}>
          <Wind size={14} className={styles.cwStatIcon} />
          <span className={styles.cwStatValue}>{clima.viento} km/h</span>
          <span className={styles.cwStatLabel}>Viento</span>
        </div>
        <div className={styles.cwStat}>
          <Droplets size={14} className={styles.cwStatIcon} />
          <span className={styles.cwStatValue}>{clima.humedad}%</span>
          <span className={styles.cwStatLabel}>Humedad</span>
        </div>
        <div className={styles.cwStat}>
          <Eye size={14} className={styles.cwStatIcon} />
          <span className={styles.cwStatValue}>{clima.visibilidad} km</span>
          <span className={styles.cwStatLabel}>Visibilidad</span>
        </div>
        <div className={styles.cwStat}>
          <Gauge size={14} className={styles.cwStatIcon} />
          <span className={styles.cwStatValue}>{clima.presion} hPa</span>
          <span className={styles.cwStatLabel}>Presión</span>
        </div>
      </div>
    </div>
  );
}
