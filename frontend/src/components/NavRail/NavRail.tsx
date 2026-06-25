'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Map,
  History,
  TriangleAlert,
  Settings,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  Mountain,
  Bug,
  Route,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from './NavRail.module.css';
import IncidenteModal from '@/components/IncidenteModal/IncidenteModal';

interface NavRailProps {
  rutaOpen?: boolean;
  onRutaToggle?: () => void;
}

const navItems = [
  { href: '/mapa',          icon: Map,           label: 'Mapa' },
  { href: '/historial',     icon: History,       label: 'Historial' },
  { href: '/riesgo',        icon: TriangleAlert, label: 'Riesgo' },
  { href: '/configuracion', icon: Settings,      label: 'Configuración' },
];

export default function NavRail({ rutaOpen = false, onRutaToggle }: NavRailProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [incidenteOpen, setIncidenteOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <>
      <nav className={styles.navRail}>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <div className={styles.logo}>
            <Mountain className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Main nav */}
        <div className={styles.navItems}>
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.navButton} ${active ? styles.active : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span className={styles.tooltip}>{label}</span>
              </Link>
            );
          })}

          {/* Botón Ruta — abre panel lateral en /mapa sin navegar */}
          {pathname.startsWith('/mapa') && (
            <button
              id="nav-ruta"
              onClick={onRutaToggle}
              className={`${styles.navButton} ${rutaOpen ? styles.active : ''}`}
              title="Calcular ruta"
            >
              <Route className="w-5 h-5" />
              <span className={styles.tooltip}>Ruta</span>
            </button>
          )}
        </div>

        {/* Bottom actions */}
        <div className={styles.bottomActions}>
          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className={styles.navButton}
            >
              {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className={styles.tooltip}>
                {resolvedTheme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              </span>
            </button>
          )}

          <button
            id="nav-reportar-incidente"
            onClick={() => setIncidenteOpen(true)}
            className={`${styles.navButton} ${incidenteOpen ? styles.active : ''}`}
          >
            <Bug className="w-5 h-5" />
            <span className={styles.tooltip}>Reportar incidente</span>
          </button>

          <button className={styles.navButton}>
            <HelpCircle className="w-5 h-5" />
            <span className={styles.tooltip}>Ayuda</span>
          </button>

          <button className={`${styles.navButton} hover:!text-red-500`}>
            <LogOut className="w-5 h-5" />
            <span className={styles.tooltip}>Salir</span>
          </button>
        </div>
      </nav>

      {/* Incidente Modal — rendered via portal at body level */}
      <IncidenteModal
        open={incidenteOpen}
        onClose={() => setIncidenteOpen(false)}
      />
    </>
  );
}
