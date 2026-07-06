import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const viewport: Viewport = {
  themeColor: '#09090b',
};

export const metadata: Metadata = {
  title: 'FrontierAdvice — Estado de Pasos Fronterizos Chile-Argentina',
  description:
    'Monitoreo en tiempo real del estado de pasos fronterizos entre Chile y Argentina. Consulta condiciones, alertas y pronósticos de riesgo.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192x192.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FrontierAdvice',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <body className="h-[100dvh] overflow-hidden relative" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
