"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, DollarSign, Activity, RefreshCw } from 'lucide-react';

export function CurrencyConverter() {
  const [amount, setAmount] = useState<number | string>(100);
  const [exchangeRate, setExchangeRate] = useState<{ compra: number; venta: number; fechaActualizacion: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // false = USD -> CLP, true = CLP -> USD
  const [invert, setInvert] = useState(false);

  useEffect(() => {
    fetchRate();
  }, []);

  const fetchRate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('https://cl.dolarapi.com/v1/cotizaciones/usd');
      if (!res.ok) throw new Error('Error fetching rate');
      const data = await res.json();
      setExchangeRate(data);
      // Nota: Aquí en el futuro se hará la llamada al backend de Strapi
    } catch (err) {
      setError('Error al obtener el tipo de cambio');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateResult = () => {
    if (!exchangeRate || !amount || isNaN(Number(amount))) return 0;
    const value = Number(amount);
    
    if (invert) {
      // CLP to USD
      return (value / exchangeRate.venta).toFixed(2);
    } else {
      // USD to CLP
      return (value * exchangeRate.compra).toFixed(0);
    }
  };

  return (
    <div className="glass-panel p-6 lg:p-8 rounded-3xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
              <DollarSign size={20} />
            </div>
            Calculadora de Divisas
          </h2>
          <p className="text-[var(--text-secondary)] mt-2">Convierte dólares a pesos chilenos y viceversa.</p>
        </div>
        <button 
          onClick={fetchRate}
          disabled={loading}
          className="p-3 bg-[var(--bg-hover)] rounded-full hover:bg-[var(--border-subtle)] transition-colors shrink-0"
          title="Actualizar tipo de cambio"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin text-blue-500' : 'text-[var(--text-secondary)]'} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {error ? (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 text-sm">{error}</div>
        ) : null}

        <div className="relative bg-[var(--bg-solid)] border border-[var(--border-strong)] rounded-2xl p-4 lg:p-8 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* From */}
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2 tracking-wider">
                Monto a Convertir
              </label>
              <div className="flex items-center gap-3 bg-[var(--bg-base)] px-4 py-3 rounded-xl border border-[var(--border-subtle)] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                <span className="text-xl font-medium text-[var(--text-secondary)]">$</span>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-transparent border-none w-full outline-none text-2xl lg:text-3xl font-bold text-[var(--text-primary)]"
                  placeholder="0.00"
                />
                <span className="font-bold text-[var(--text-secondary)]">{invert ? 'CLP' : 'USD'}</span>
              </div>
            </div>

            {/* Swap Button */}
            <button 
              onClick={() => setInvert(!invert)}
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform shrink-0 z-10 -my-4 lg:my-0 lg:-mx-4"
            >
              <ArrowRightLeft size={20} className="lg:rotate-0 rotate-90" />
            </button>

            {/* To */}
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2 tracking-wider">
                Resultado
              </label>
              <div className="flex items-center gap-3 bg-[var(--bg-hover)] px-4 py-3 rounded-xl border border-transparent">
                <span className="text-xl font-medium text-[var(--text-secondary)]">$</span>
                <div className="w-full text-2xl lg:text-3xl font-bold text-[var(--text-primary)] overflow-hidden text-ellipsis">
                  {loading ? '...' : calculateResult()}
                </div>
                <span className="font-bold text-[var(--text-secondary)]">{invert ? 'USD' : 'CLP'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-solid)] p-4 rounded-xl border border-[var(--border-subtle)] flex flex-col sm:flex-row justify-between items-center gap-4 text-sm mt-auto">
           <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Activity size={16} />
              <span>
                Valor de DolarAPI: 
                <span className="text-[var(--text-primary)] font-semibold ml-2">
                   {loading ? '...' : `$${exchangeRate?.compra} (C) / $${exchangeRate?.venta} (V)`}
                </span>
              </span>
           </div>
           {exchangeRate && (
             <div className="text-[var(--text-secondary)] text-xs sm:text-right">
               Última actualización:<br/>
               {new Date(exchangeRate.fechaActualizacion).toLocaleString()}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
