import { History } from 'lucide-react';

export const metadata = {
  title: 'Historial — FrontierAdvice',
};

export default function HistorialPage() {
  return (
    <div className="flex-1 flex items-center justify-center h-screen" style={{ color: 'var(--sidebar-text)' }}>
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
          <History className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-xl font-bold">Historial</h1>
        <p className="text-sm" style={{ color: 'var(--sidebar-text-muted)' }}>
          Próximamente — historial de estados y eventos.
        </p>
      </div>
    </div>
  );
}
