import NavRail from '@/components/NavRail/NavRail';
import MapDashboard from '@/components/MapArea/MapDashboard';

export const metadata = {
  title: 'Mapa de Pasos Fronterizos — FrontierAdvice',
  description: 'Mapa interactivo con el estado en tiempo real de los pasos fronterizos entre Chile y Argentina.',
};

export default function MapaPage() {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden flex-col md:flex-row relative bg-[var(--bg-base)]">
      <NavRail />
      <MapDashboard />
    </div>
  );
}
