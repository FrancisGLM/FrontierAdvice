import { TriangleAlert } from 'lucide-react';

export const metadata = {
  title: 'Análisis de Riesgo — FrontierAdvice',
};

export default function RiesgoPage() {
  return (
    <div className="flex-1 flex items-center justify-center h-screen" style={{ color: 'var(--sidebar-text)' }}>
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
          <TriangleAlert className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-xl font-bold">Análisis de Riesgo</h1>
        <p className="text-sm" style={{ color: 'var(--sidebar-text-muted)' }}>
          Próximamente — análisis predictivo de riesgo en pasos fronterizos.
        </p>
      </div>
    </div>
  );
}
