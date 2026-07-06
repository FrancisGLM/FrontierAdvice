"use client";

import React, { useEffect } from 'react';
import { X, FileText, Car, Users, MapPin, AlertCircle } from 'lucide-react';

interface BorderInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BorderInfoModal({ isOpen, onClose }: BorderInfoModalProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="bg-[var(--bg-solid)] border border-[var(--border-strong)] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-solid)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] p-6 flex items-center justify-between z-20">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="text-blue-500" />
              Requisitos Paso Los Libertadores
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Información oficial para el cruce fronterizo Chile - Argentina.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center hover:bg-[var(--border-subtle)] transition-colors text-[var(--text-primary)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 lg:p-8 space-y-8">
          
          {/* General Docs */}
          <section>
             <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-blue-500">
               <FileText size={20} />
               Documentación Personal General
             </h3>
             <ul className="space-y-3 text-[var(--text-primary)]">
               <li className="flex items-start gap-3 bg-[var(--bg-hover)] p-4 rounded-xl border border-transparent hover:border-[var(--border-subtle)] transition-colors">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                 <p><strong>Identidad:</strong> Cédula de Identidad (DNI) vigente o Pasaporte válido en buen estado.</p>
               </li>
               <li className="flex items-start gap-3 bg-[var(--bg-hover)] p-4 rounded-xl border border-transparent hover:border-[var(--border-subtle)] transition-colors">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                 <p><strong>Menores de edad:</strong> Si viajan solos o con un solo progenitor, requieren <strong>Autorización Notarial</strong> y Certificado de Nacimiento (o Libreta de Familia).</p>
               </li>
               <li className="flex items-start gap-3 bg-amber-500/5 p-4 rounded-xl border border-amber-500/30">
                 <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                 <p><strong>Aduanas y SAG:</strong> Es obligatorio completar la Declaración Jurada Conjunta (Aduanas/SAG) al ingresar a Chile para declarar si porta productos de origen animal o vegetal.</p>
               </li>
             </ul>
          </section>

          {/* Vehicle Docs */}
          <section>
             <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-emerald-500">
               <Car size={20} />
               Requisitos del Vehículo
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="border border-[var(--border-subtle)] rounded-xl p-5 bg-[var(--bg-hover)]">
                 <h4 className="font-semibold mb-3 border-b border-[var(--border-subtle)] pb-2 flex items-center justify-between">
                   Documentos del Auto
                 </h4>
                 <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                   <li className="flex gap-2"><span className="text-emerald-500">•</span> Padrón del Vehículo (Chile) o Cédula Verde (Argentina).</li>
                   <li className="flex gap-2"><span className="text-emerald-500">•</span> <strong>Seguro Internacional:</strong> Seguro Mercosur / RCI.</li>
                   <li className="flex gap-2"><span className="text-emerald-500">•</span> Formulario de "Salida y Admisión Temporal" (Electrónico en Chile, OM-2261 en Argentina).</li>
                 </ul>
               </div>
               <div className="border border-[var(--border-subtle)] rounded-xl p-5 bg-[var(--bg-hover)]">
                 <h4 className="font-semibold mb-3 border-b border-[var(--border-subtle)] pb-2 flex items-center justify-between">
                   Casos Especiales
                 </h4>
                 <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                   <li className="flex gap-2"><span className="text-amber-500">•</span> <strong>Si no eres el dueño:</strong> Autorización Notarial del propietario (Chile) o Cédula Azul (Argentina).</li>
                   <li className="flex gap-2"><span className="text-amber-500">•</span> <strong>Autos Argentinos:</strong> Deben tener los cristales grabados con la patente del vehículo.</li>
                 </ul>
               </div>
             </div>
          </section>

          {/* Summary */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
             <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/40 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Users size={80} /></div>
                <h4 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-4">Chilenos hacia Argentina</h4>
                <ul className="space-y-2 text-sm font-medium text-[var(--text-secondary)] relative z-10">
                  <li className="flex items-center gap-2">✅ Cédula de Identidad o Pasaporte.</li>
                  <li className="flex items-center gap-2">✅ Padrón y Seguro Internacional.</li>
                  <li className="flex items-center gap-2">✅ Formulario Electrónico (Vehículo).</li>
                  <li className="flex items-center gap-2">✅ Autorización notarial (menores/auto 3ro).</li>
                </ul>
             </div>
             
             <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Users size={80} /></div>
                <h4 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-4">Argentinos hacia Chile</h4>
                <ul className="space-y-2 text-sm font-medium text-[var(--text-secondary)] relative z-10">
                  <li className="flex items-center gap-2">✅ DNI o Pasaporte vigente.</li>
                  <li className="flex items-center gap-2">✅ Cédula Verde o Cédula Azul.</li>
                  <li className="flex items-center gap-2">✅ Seguro Mercosur y Cristales Grabados.</li>
                  <li className="flex items-center gap-2">✅ Formulario OM-2261 y DJ SAG (al ingresar).</li>
                </ul>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
