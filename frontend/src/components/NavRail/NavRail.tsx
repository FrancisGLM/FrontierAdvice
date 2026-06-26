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
  Sun,
  Moon,
  Mountain,
  Bug,
  Shield,
  Route,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from './NavRail.module.css';
import IncidenteModal from '@/components/IncidenteModal/IncidenteModal';
import { useAuth } from '@/lib/AuthContext';

interface NavRailProps {
  rutaOpen?: boolean;
  onRutaToggle?: () => void;
}

const navItemsTop = [
  { href: '/mapa', icon: Map, label: 'Mapa' },
];

const navItemsBottom = [
  { href: '/historial',     icon: History,       label: 'Historial' },
  { href: '/riesgo',        icon: TriangleAlert, label: 'Riesgo' },
  { href: '/configuracion', icon: Settings,      label: 'Configuración' },
];

export default function NavRail({ rutaOpen = false, onRutaToggle }: NavRailProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { isAdmin } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [incidenteOpen, setIncidenteOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const dynamicNavItemsBottom = isAdmin
    ? [...navItemsBottom, { href: '/admin', icon: Shield, label: 'Panel Admin' }]
    : navItemsBottom;

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
          {/* Mapa */}
          {navItemsTop.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href === '/mapa' && pathname.startsWith('/mapa'));
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.navButton} ${active && !rutaOpen ? styles.active : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span className={styles.tooltip}>{label}</span>
              </Link>
            );
          })}

          {/* Botón Ruta — siempre visible en /mapa, entre Mapa e Historial */}
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

          {/* Historial, Riesgo, Configuración, Admin */}
          {dynamicNavItemsBottom.map(({ href, icon: Icon, label }) => {
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

        </div>
      </nav>

      {/* Modals */}
      <IncidenteModal
        open={incidenteOpen}
        onClose={() => setIncidenteOpen(false)}
      />
    </>
  );
}
