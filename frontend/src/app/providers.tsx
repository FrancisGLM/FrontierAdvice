'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/AuthContext';
import { RutaProvider } from '@/lib/RutaContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <RutaProvider>
          {children}
        </RutaProvider>
      </AuthProvider>
    </NextThemesProvider>
  );
}
