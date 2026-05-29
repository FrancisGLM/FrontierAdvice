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
} from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from './NavRail.module.css';

const navItems = [
  { href: '/mapa', icon: Map, label: 'Mapa' },
  { href: '/historial', icon: History, label: 'Historial' },
  { href: '/riesgo', icon: TriangleAlert, label: 'Riesgo' },
  { href: '/configuracion', icon: Settings, label: 'Configuración' },
];

export default function NavRail() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSoon = () => {
    alert('Próximamente');
  };

  return (
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

        <button onClick={handleSoon} className={styles.navButton}>
          <Bug className="w-5 h-5" />
          <span className={styles.tooltip}>Reportar problema</span>
        </button>

        <button onClick={handleSoon} className={styles.navButton}>
          <HelpCircle className="w-5 h-5" />
          <span className={styles.tooltip}>Ayuda</span>
        </button>

        <button onClick={handleSoon} className={`${styles.navButton} hover:!text-red-500`}>
          <LogOut className="w-5 h-5" />
          <span className={styles.tooltip}>Salir</span>
        </button>
      </div>
    </nav>
  );
}
