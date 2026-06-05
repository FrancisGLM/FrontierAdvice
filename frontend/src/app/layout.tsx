import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'FrontierAdvice — Estado de Pasos Fronterizos Chile-Argentina',
  description:
    'Monitoreo en tiempo real del estado de pasos fronterizos entre Chile y Argentina. Consulta condiciones, alertas y pronósticos de riesgo.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <body className="h-screen overflow-hidden" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
