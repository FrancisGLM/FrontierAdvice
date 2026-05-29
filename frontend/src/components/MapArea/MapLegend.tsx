import { EstadoPaso } from '@/lib/types';
import styles from './MapArea.module.css';

const LEGEND = [
  { estado: 'abierto' as EstadoPaso, color: 'var(--status-open)', label: 'Abierto' },
  { estado: 'precaucion' as EstadoPaso, color: 'var(--status-caution)', label: 'Precaución' },
  { estado: 'cerrado' as EstadoPaso, color: 'var(--status-closed)', label: 'Cerrado' },
];

export default function MapLegend() {
  return (
    <div className={`${styles.legend} glass-panel`}>
      {LEGEND.map(({ color, label }) => (
        <div key={label} className={styles.legendItem}>
          <div
            className={styles.legendDot}
            style={{ backgroundColor: color }}
          />
          <span className={styles.legendText}>{label}</span>
        </div>
      ))}
    </div>
  );
}
