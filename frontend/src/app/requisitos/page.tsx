"use client";

import React, { useState } from 'react';
import { Plane, FileText, Car, Users, Download, AlertTriangle, ExternalLink } from 'lucide-react';

type Country = 'Argentina' | 'Perú' | 'Bolivia' | null;

export default function RequisitosPage() {
  const [selectedCountry, setSelectedCountry] = useState<Country>(null);

  const renderContent = () => {
    if (!selectedCountry) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-[40vh]">
          <p className="text-[var(--text-secondary)] text-lg">
            Selecciona un destino arriba para ver los requisitos específicos.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Documentación Personal */}
        <section className="glass-panel p-6 lg:p-8 rounded-3xl border border-[var(--border-subtle)]">
          <h2 className="text-2xl font-bold flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            Documentación Personal (Ida y Vuelta)
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[var(--bg-base)] p-5 rounded-2xl border border-[var(--border-subtle)]">
              <h3 className="font-bold text-lg mb-3">Adultos</h3>
              <ul className="space-y-2 text-[var(--text-secondary)] text-sm">
                <li className="flex gap-2"><span className="text-blue-500">•</span> Cédula Nacional de Identidad o Pasaporte vigente y en buen estado.</li>
                <li className="flex gap-2"><span className="text-blue-500">•</span> No tener causas judiciales pendientes ni arraigo nacional.</li>
              </ul>
            </div>
            
            <div className="bg-[var(--bg-base)] p-5 rounded-2xl border border-[var(--border-subtle)]">
              <h3 className="font-bold text-lg mb-3">Menores de Edad</h3>
              <ul className="space-y-2 text-[var(--text-secondary)] text-sm">
                <li className="flex gap-2"><span className="text-blue-500">•</span> <strong className="text-[var(--text-primary)]">Con ambos padres:</strong> Certificado de nacimiento o libreta de matrimonio.</li>
                <li className="flex gap-2"><span className="text-blue-500">•</span> <strong className="text-[var(--text-primary)]">Con un solo padre:</strong> Certificado de nacimiento y Autorización Notarial del padre que no viaja.</li>
                <li className="flex gap-2"><span className="text-blue-500">•</span> <strong className="text-[var(--text-primary)]">Sin sus padres:</strong> Certificado de nacimiento y Autorización Notarial de ambos padres.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Documentación de Vehículos */}
        <section className="glass-panel p-6 lg:p-8 rounded-3xl border border-[var(--border-subtle)]">
          <h2 className="text-2xl font-bold flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <Car size={20} />
            </div>
            Documentación del Vehículo
          </h2>

          <div className="space-y-4 text-[var(--text-secondary)] text-sm">
            <div className="flex gap-3 items-start bg-[var(--bg-base)] p-4 rounded-xl border border-[var(--border-subtle)]">
              <div className="mt-0.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /></div>
              <div>
                <strong className="text-[var(--text-primary)] block mb-1">Propiedad del Vehículo</strong>
                Padrón del vehículo y/o certificado de anotaciones vigentes (son los únicos válidos).
              </div>
            </div>

            <div className="flex gap-3 items-start bg-[var(--bg-base)] p-4 rounded-xl border border-[var(--border-subtle)]">
              <div className="mt-0.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /></div>
              <div>
                <strong className="text-[var(--text-primary)] block mb-1">Vehículos de Terceros</strong>
                Si el conductor no es el dueño, debe portar autorización notarial impresa del propietario.
                {selectedCountry === 'Perú' && (
                  <div className="mt-2 text-amber-500 bg-amber-500/10 p-3 rounded-lg flex gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>Para Perú, este poder notarial exige estar visado mediante el Convenio de Apostilla (apostilla.gob.cl).</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 items-start bg-[var(--bg-base)] p-4 rounded-xl border border-[var(--border-subtle)]">
              <div className="mt-0.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /></div>
              <div>
                <strong className="text-[var(--text-primary)] block mb-1">Seguro Obligatorio</strong>
                Seguro de responsabilidad civil internacional (Seguro Mercosur). {selectedCountry === 'Argentina' && 'En Argentina, el conductor que hace el trámite aduanero debe ser el mismo que maneja.'}
              </div>
            </div>
          </div>
        </section>

        {/* Formularios Oficiales */}
        <section className="glass-panel p-6 lg:p-8 rounded-3xl border border-[var(--border-subtle)]">
          <h2 className="text-2xl font-bold flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-500 flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            Trámites y Formularios Oficiales
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <a href="https://www.aduana.cl/aduana/site/docs/20181228/20181228084211/declaracion_conjunta_sag_aduanas.pdf" target="_blank" rel="noreferrer" className="flex items-center justify-between bg-[var(--bg-base)] hover:bg-[var(--bg-hover)] p-5 rounded-2xl border border-[var(--border-subtle)] transition-colors group">
              <div>
                <h3 className="font-bold text-[var(--text-primary)]">Declaración Conjunta SAG-Aduanas</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Obligatorio al regresar a Chile (declaración de productos vegetales/animales).</p>
              </div>
              <Download size={20} className="text-[var(--text-secondary)] group-hover:text-purple-500 transition-colors shrink-0 ml-4" />
            </a>

            {(selectedCountry === 'Argentina' || selectedCountry === 'Bolivia') && (
              <a href="https://www.aduana.cl/solicitar-permiso-para-el-ingreso-o-la-salida-temporal-de-un-vehiculo/aduana/2019-08-05/123824.html" target="_blank" rel="noreferrer" className="flex items-center justify-between bg-[var(--bg-base)] hover:bg-[var(--bg-hover)] p-5 rounded-2xl border border-[var(--border-subtle)] transition-colors group">
                <div>
                  <h3 className="font-bold text-[var(--text-primary)]">Salida Temporal de Vehículos</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Formulario Único (Trámite Web Aduana Chile).</p>
                </div>
                <ExternalLink size={20} className="text-[var(--text-secondary)] group-hover:text-purple-500 transition-colors shrink-0 ml-4" />
              </a>
            )}

            {selectedCountry === 'Perú' && (
              <a href="https://www.aduana.cl/aduana/site/docs/20181228/20181228084645/relacion_de_pasajeros_2011__3_.xls" target="_blank" rel="noreferrer" className="flex items-center justify-between bg-[var(--bg-base)] hover:bg-[var(--bg-hover)] p-5 rounded-2xl border border-[var(--border-subtle)] transition-colors group">
                <div>
                  <h3 className="font-bold text-[var(--text-primary)]">Formulario "Relación de Pasajeros"</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Para viajes a Tacna (Estadía menor a 7 días).</p>
                </div>
                <Download size={20} className="text-[var(--text-secondary)] group-hover:text-purple-500 transition-colors shrink-0 ml-4" />
              </a>
            )}
          </div>
        </section>

      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 lg:p-12 relative">
      {/* Decoración de fondo */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] rounded-full bg-purple-600/5 blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <header className="mb-12 text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-[var(--text-primary)]">
            Requisitos de <span className="text-blue-500">Viaje</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto lg:mx-0">
            Documentación y trámites obligatorios para cruzar las fronteras terrestres de Chile de forma rápida y segura.
          </p>
        </header>

        {/* Country Selector */}
        <div className="glass-panel p-4 rounded-2xl mb-8 flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start overflow-x-auto">
          <span className="font-semibold text-[var(--text-secondary)] mr-2 shrink-0">¿Hacia dónde viajas?</span>
          {(['Argentina', 'Perú', 'Bolivia'] as Country[]).map(country => (
            <button
              key={country}
              onClick={() => setSelectedCountry(country)}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                selectedCountry === country 
                  ? 'bg-blue-600 text-white shadow-lg scale-105' 
                  : 'bg-[var(--bg-base)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-strong)]'
              }`}
            >
              <Plane size={18} className={selectedCountry === country ? 'animate-bounce' : ''} />
              {country}
            </button>
          ))}
        </div>

        {renderContent()}

      </div>
    </div>
  );
}
