'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { N8nDobleRutaResponse } from '@/lib/types';
import { useCalcularRuta, Pais, TipoVehiculo, SubtipoCamion, DireccionEstructurada } from '@/lib/hooks/useCalcularRuta';

export type Step = 'origen' | 'destino' | 'vehiculo';

export const EMPTY_DIRECCION: DireccionEstructurada = { calle: '', numero: '', comuna: '', ciudad: '' };

interface RutaContextType {
  // Form State
  step: Step;
  setStep: React.Dispatch<React.SetStateAction<Step>>;
  paisOrigen: Pais | '';
  setPaisOrigen: React.Dispatch<React.SetStateAction<Pais | ''>>;
  origen: DireccionEstructurada;
  setOrigen: React.Dispatch<React.SetStateAction<DireccionEstructurada>>;
  paisDestino: Pais | '';
  setPaisDestino: React.Dispatch<React.SetStateAction<Pais | ''>>;
  destino: DireccionEstructurada;
  setDestino: React.Dispatch<React.SetStateAction<DireccionEstructurada>>;
  vehiculo: TipoVehiculo | '';
  setVehiculo: React.Dispatch<React.SetStateAction<TipoVehiculo | ''>>;
  subtipo: SubtipoCamion | '';
  setSubtipo: React.Dispatch<React.SetStateAction<SubtipoCamion | ''>>;
  
  // Panel UI State
  isCalculated: boolean;
  setIsCalculated: React.Dispatch<React.SetStateAction<boolean>>;
  leftPanel: 'filtros' | 'ruta' | 'resultados';
  setLeftPanel: React.Dispatch<React.SetStateAction<'filtros' | 'ruta' | 'resultados'>>;
  alternativeIsFocused: boolean;
  setAlternativeIsFocused: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Calcular Ruta Hook State
  calcular: ReturnType<typeof useCalcularRuta>['calcular'];
  limpiar: ReturnType<typeof useCalcularRuta>['limpiar'];
  loading: boolean;
  error: string | null;
  rutaResultado: N8nDobleRutaResponse | null;
  
  // Helpers
  clearAll: () => void;
}

const RutaContext = createContext<RutaContextType | undefined>(undefined);

export function RutaProvider({ children }: { children: ReactNode }) {
  // ── Form State ──
  const [step, setStep] = useState<Step>('origen');
  const [paisOrigen, setPaisOrigen] = useState<Pais | ''>('');
  const [origen, setOrigen] = useState<DireccionEstructurada>(EMPTY_DIRECCION);
  const [paisDestino, setPaisDestino] = useState<Pais | ''>('');
  const [destino, setDestino] = useState<DireccionEstructurada>(EMPTY_DIRECCION);
  const [vehiculo, setVehiculo] = useState<TipoVehiculo | ''>('');
  const [subtipo, setSubtipo] = useState<SubtipoCamion | ''>('');

  // ── UI State ──
  const [isCalculated, setIsCalculated] = useState(false);
  const [leftPanel, setLeftPanel] = useState<'filtros' | 'ruta' | 'resultados'>('filtros');
  const [alternativeIsFocused, setAlternativeIsFocused] = useState(false);

  // ── Hook State ──
  const { calcular, limpiar, loading, error, resultado: rutaResultado } = useCalcularRuta();

  const clearAll = () => {
    setStep('origen');
    setPaisOrigen('');
    setOrigen(EMPTY_DIRECCION);
    setPaisDestino('');
    setDestino(EMPTY_DIRECCION);
    setVehiculo('');
    setSubtipo('');
    setIsCalculated(false);
    setAlternativeIsFocused(false);
    limpiar();
  };

  return (
    <RutaContext.Provider value={{
      step, setStep,
      paisOrigen, setPaisOrigen,
      origen, setOrigen,
      paisDestino, setPaisDestino,
      destino, setDestino,
      vehiculo, setVehiculo,
      subtipo, setSubtipo,
      isCalculated, setIsCalculated,
      leftPanel, setLeftPanel,
      alternativeIsFocused, setAlternativeIsFocused,
      calcular, limpiar, loading, error, rutaResultado,
      clearAll
    }}>
      {children}
    </RutaContext.Provider>
  );
}

export function useRutaContext() {
  const context = useContext(RutaContext);
  if (context === undefined) {
    throw new Error('useRutaContext must be used within a RutaProvider');
  }
  return context;
}
