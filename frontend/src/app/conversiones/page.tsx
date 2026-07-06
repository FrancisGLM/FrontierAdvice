"use client";

import React, { useState } from 'react';
import { ArrowRightLeft, Info, Plane, ShieldCheck } from 'lucide-react';
import { BorderInfoModal } from '@/components/BorderInfoModal';
import { CurrencyConverter } from '@/components/CurrencyConverter';

export default function ConversionesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] p-6 lg:p-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/10 blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-10 text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Panel de Servicios <span className="text-blue-500">Fronterizos</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto lg:mx-0">
            Gestiona tus conversiones de divisas en tiempo real y revisa los requisitos obligatorios para cruzar la frontera sin contratiempos.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Converter Tool */}
          <div className="lg:col-span-8">
            <CurrencyConverter />
          </div>

          {/* Quick Actions / Info */}
          <div className="lg:col-span-4 space-y-6 flex flex-col justify-center">
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 border border-[var(--border-subtle)] shadow-sm hover:shadow-md">
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Plane size={140} />
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center mb-6">
                <Info size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Requisitos de Viaje</h3>
              <p className="text-[var(--text-secondary)] mb-6 text-sm">
                Documentación obligatoria para personas y vehículos en el cruce internacional.
              </p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full py-3.5 px-4 bg-[var(--bg-solid)] border border-[var(--border-strong)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-xl font-medium transition-colors flex items-center justify-center gap-2 group-hover:border-blue-500/50"
              >
                Ver Requisitos <ArrowRightLeft size={16} className="text-blue-500" />
              </button>
            </div>
            
            <div className="glass-panel p-6 rounded-3xl border border-[var(--border-subtle)] shadow-sm">
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                 <ShieldCheck className="text-emerald-500" />
                 Estado del Paso
               </h3>
               <div className="bg-[var(--status-open-bg)] border border-emerald-500/20 text-[var(--status-open)] px-4 py-3 rounded-xl flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="font-semibold text-sm">Paso Habilitado (24 Hrs)</span>
               </div>
               <p className="text-xs text-[var(--text-secondary)] mt-4">
                 * El estado es referencial. Revisa canales oficiales ante alertas climáticas.
               </p>
            </div>
          </div>
        </div>
      </div>

      <BorderInfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  );
}
