'use client';

import { useId } from 'react';
import { IconoClima } from '@/lib/types';

interface WeatherIconProps {
  icono: IconoClima;
  /** Tamaño en px, default 48 */
  size?: number;
}

/* ═══════════════════════════════════════════════════════
   ☀️  SOL  – núcleo dorado + rayos girando
═══════════════════════════════════════════════════════ */
function SolIcon({ size }: { size: number }) {
  const u = useId().replace(/[^a-z0-9]/gi, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <radialGradient id={`a${u}`} cx="36%" cy="28%" r="72%">
          <stop offset="0%"   stopColor="#FFFDE7" />
          <stop offset="42%"  stopColor="#FFD600" />
          <stop offset="100%" stopColor="#F57F17" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="22" fill="#FFD600" opacity="0.10" />
      <g>
        <animateTransform attributeName="transform" type="rotate"
          from="0 32 32" to="360 32 32" dur="14s" repeatCount="indefinite" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
          <rect key={i} x="30.5" y="10" width="3" height="8" rx="1.5"
            fill="#FFE57F" transform={`rotate(${deg} 32 32)`} />
        ))}
      </g>
      <circle cx="32" cy="32" r="13" fill={`url(#a${u})`} />
      <ellipse cx="27.5" cy="27" rx="5" ry="3.5" fill="rgba(255,255,255,0.44)" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   ⛅  NUBLADO  – sol grande + nube flotante suave
═══════════════════════════════════════════════════════ */
function NubladoIcon({ size }: { size: number }) {
  const u = useId().replace(/[^a-z0-9]/gi, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <radialGradient id={`b${u}`} cx="36%" cy="28%" r="72%">
          <stop offset="0%"   stopColor="#FFFDE7" />
          <stop offset="50%"  stopColor="#FFD600" />
          <stop offset="100%" stopColor="#FFB300" />
        </radialGradient>
        <linearGradient id={`c${u}`} x1="25%" y1="0%" x2="75%" y2="100%">
          <stop offset="0%"   stopColor="#FFFFFF" />
          <stop offset="55%"  stopColor="#E0E7EF" />
          <stop offset="100%" stopColor="#90A4AE" />
        </linearGradient>
        <filter id={`fd${u}`} x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#00000028" />
        </filter>
      </defs>

      {/*
        Sol más grande: center (43, 22), radius 12
        - 8 rayos de r=14 a r=20 (rect: y=2, height=8)
        - Todos los rayos caben dentro del viewBox (0-64)
      */}
      <g>
        <animateTransform attributeName="transform" type="rotate"
          from="0 43 22" to="360 43 22" dur="12s" repeatCount="indefinite" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
          <rect key={i} x="41.5" y="2" width="3" height="8" rx="1.5"
            fill="#FFE082" transform={`rotate(${deg} 43 22)`} />
        ))}
        {/* Núcleo del sol (radio 12, más grande que antes) */}
        <circle cx="43" cy="22" r="12" fill={`url(#b${u})`} />
        <ellipse cx="39.5" cy="18" rx="4.5" ry="3" fill="rgba(255,255,255,0.42)" />
      </g>

      {/* Nube – flota de izquierda a derecha */}
      <g>
        <animateTransform attributeName="transform" type="translate"
          values="0,0; 3,0; 0,0" dur="4s" repeatCount="indefinite"
          calcMode="spline" keySplines="0.45,0,0.55,1;0.45,0,0.55,1" />
        <path
          d="M 6,48 C 6,42 9,37 15,35 C 14,27 20,21 28,21 C 36,21 43,27 44,35
             C 49,34 54,38 54,44 C 54,51 49,55 43,55 L 15,55
             C 9,55 6,52 6,48 Z"
          fill={`url(#c${u})`} filter={`url(#fd${u})`}
        />
      </g>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   🌧️  LLUVIA  – nube gris + 3 gotas en cascada
═══════════════════════════════════════════════════════ */
function LluviaIcon({ size }: { size: number }) {
  const u = useId().replace(/[^a-z0-9]/gi, '');
  const drops = [
    { x1: 20, x2: 17, delay: '0s'    },
    { x1: 32, x2: 29, delay: '0.32s' },
    { x1: 44, x2: 41, delay: '0.64s' },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id={`e${u}`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%"   stopColor="#78909C" />
          <stop offset="55%"  stopColor="#546E7A" />
          <stop offset="100%" stopColor="#37474F" />
        </linearGradient>
        <filter id={`fe${u}`} x="-8%" y="-8%" width="116%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#00000030" />
        </filter>
      </defs>
      <path
        d="M 8,39 C 8,33 11,28 17,26 C 16,18 22,12 30,12
           C 38,12 45,18 46,26 C 51,25 57,29 57,36
           C 57,43 51,47 45,47 L 17,47 C 11,47 8,43 8,39 Z"
        fill={`url(#e${u})`} filter={`url(#fe${u})`}
      />
      {drops.map(({ x1, x2, delay }) => (
        <g key={x1}>
          <animate attributeName="opacity"
            values="0;1;1;0" keyTimes="0;0.08;0.72;1"
            dur="1.1s" begin={delay} repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate"
            from="0 0" to="0 14" dur="1.1s" begin={delay} repeatCount="indefinite" />
          <line x1={x1} y1="50" x2={x2} y2="61"
            stroke="#64B5F6" strokeWidth="2.8" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   🌧️⚡  LLUVIA INTENSA  – nube muy oscura + 4 gotas gruesas
═══════════════════════════════════════════════════════ */
function LluviaIntensaIcon({ size }: { size: number }) {
  const u = useId().replace(/[^a-z0-9]/gi, '');
  const drops = [
    { x1: 15, x2: 11, delay: '0s'    },
    { x1: 25, x2: 21, delay: '0.22s' },
    { x1: 37, x2: 33, delay: '0.44s' },
    { x1: 49, x2: 45, delay: '0.66s' },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id={`i${u}`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%"   stopColor="#546E7A" />
          <stop offset="50%"  stopColor="#37474F" />
          <stop offset="100%" stopColor="#102027" />
        </linearGradient>
        <filter id={`fi${u}`} x="-8%" y="-8%" width="116%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#00000045" />
        </filter>
      </defs>
      {/* Nube más oscura y grande */}
      <path
        d="M 6,37 C 6,31 9,26 15,24 C 14,16 20,10 28,10
           C 36,10 43,16 44,24 C 49,23 56,27 56,34
           C 56,41 49,45 43,45 L 15,45 C 9,45 6,41 6,37 Z"
        fill={`url(#i${u})`} filter={`url(#fi${u})`}
      />
      {/* 4 gotas gruesas cayendo rápido */}
      {drops.map(({ x1, x2, delay }) => (
        <g key={x1}>
          <animate attributeName="opacity"
            values="0;1;1;0" keyTimes="0;0.06;0.68;1"
            dur="0.85s" begin={delay} repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate"
            from="0 0" to="0 16" dur="0.85s" begin={delay} repeatCount="indefinite" />
          <line x1={x1} y1="48" x2={x2} y2="61"
            stroke="#42A5F5" strokeWidth="3.2" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   🌨️  NIEVE  – nube azul claro + copos de 6 brazos
═══════════════════════════════════════════════════════ */
function NieveIcon({ size }: { size: number }) {
  const u = useId().replace(/[^a-z0-9]/gi, '');
  const SIN60 = 5.2; // 6 * sin(60°)
  const COS60 = 3.0; // 6 * cos(60°)
  const flakes = [
    { cx: 20, cy: 53, delay: '0s'   },
    { cx: 32, cy: 53, delay: '0.6s' },
    { cx: 44, cy: 53, delay: '1.2s' },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id={`g${u}`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%"   stopColor="#B3E5FC" />
          <stop offset="55%"  stopColor="#29B6F6" />
          <stop offset="100%" stopColor="#0277BD" />
        </linearGradient>
        <filter id={`fg${u}`} x="-8%" y="-8%" width="116%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#00000030" />
        </filter>
      </defs>
      <path
        d="M 8,37 C 8,31 11,26 17,24 C 16,16 22,10 30,10
           C 38,10 45,16 46,24 C 51,23 57,27 57,34
           C 57,41 51,45 45,45 L 17,45 C 11,45 8,41 8,37 Z"
        fill={`url(#g${u})`} filter={`url(#fg${u})`}
      />
      {flakes.map(({ cx, cy, delay }) => (
        <g key={cx}>
          <animate attributeName="opacity"
            values="0;1;1;0" keyTimes="0;0.08;0.80;1"
            dur="1.8s" begin={delay} repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate"
            from="0 0" to="0 9" dur="1.8s" begin={delay} repeatCount="indefinite" />
          <line x1={cx} y1={cy - 6} x2={cx} y2={cy + 6}
            stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          <line x1={cx + SIN60} y1={cy - COS60} x2={cx - SIN60} y2={cy + COS60}
            stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          <line x1={cx + SIN60} y1={cy + COS60} x2={cx - SIN60} y2={cy - COS60}
            stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r="2" fill="white" />
        </g>
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   ⛈️  TORMENTA  – nube oscura + rayo parpadeante
═══════════════════════════════════════════════════════ */
function TormentaIcon({ size }: { size: number }) {
  const u = useId().replace(/[^a-z0-9]/gi, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id={`h${u}`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%"   stopColor="#546E7A" />
          <stop offset="55%"  stopColor="#37474F" />
          <stop offset="100%" stopColor="#102027" />
        </linearGradient>
        <filter id={`fh${u}`} x="-8%" y="-8%" width="116%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#00000050" />
        </filter>
        <filter id={`fl${u}`} x="-40%" y="-20%" width="180%" height="150%">
          <feDropShadow dx="0" dy="0" stdDeviation="3.5"
            floodColor="#FFD600" floodOpacity="0.85" />
        </filter>
      </defs>
      <path
        d="M 8,37 C 8,31 11,26 17,24 C 16,16 22,10 30,10
           C 38,10 45,16 46,24 C 51,23 57,27 57,34
           C 57,41 51,45 45,45 L 17,45 C 11,45 8,41 8,37 Z"
        fill={`url(#h${u})`} filter={`url(#fh${u})`}
      />
      {/* Rayo Z – coordenadas absolutas dentro del viewBox */}
      <path d="M 34 45 L 24 57 L 31 57 L 27 63 L 41 51 L 34 51 Z"
        fill="#FFF176" filter={`url(#fl${u})`}>
        <animate attributeName="opacity"
          values="1;1;0.03;0.9;1;1;0.03;1"
          keyTimes="0;0.30;0.37;0.43;0.50;0.72;0.79;1"
          dur="2.6s" repeatCount="indefinite" />
        <animate attributeName="fill"
          values="#FFF176;#FFF176;#FFFFFF;#FFD600;#FFF176;#FFF176;#FFFFFF;#FFF176"
          keyTimes="0;0.30;0.37;0.43;0.50;0.72;0.79;1"
          dur="2.6s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   Router de iconos
═══════════════════════════════════════════════════════ */
const iconMap: Record<IconoClima, React.ComponentType<{ size: number }>> = {
  sol:           SolIcon,
  nublado:       NubladoIcon,
  lluvia:        LluviaIcon,
  lluvia_intensa: LluviaIntensaIcon,
  nieve:         NieveIcon,
  tormenta:      TormentaIcon,
};

export default function WeatherIcon({ icono, size = 48 }: WeatherIconProps) {
  const Icon = iconMap[icono];
  return <Icon size={size} />;
}
