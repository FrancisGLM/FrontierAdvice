import NavRail from '@/components/NavRail/NavRail';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden flex-col md:flex-row relative bg-[var(--bg-base)]">
      <NavRail />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
