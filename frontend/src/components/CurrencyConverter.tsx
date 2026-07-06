"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, DollarSign, Activity, RefreshCw } from 'lucide-react';

const CURRENCIES = ['USD', 'CLP', 'ARS', 'PEN'];

export function CurrencyConverter() {
  const [amount, setAmount] = useState<number | string>(100);
  const [exchangeRate, setExchangeRate] = useState<{ rates: Record<string, number>; fechaActualizacion: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('CLP');

  useEffect(() => {
    fetchRate();
  }, []);

  const fetchRate = async () => {
    setLoading(true);
    setError('');
    try {
      // Temporal API for multiple currencies. Will be replaced with Strapi.
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (!res.ok) throw new Error('Error fetching rate');
      const data = await res.json();
      
      setExchangeRate({
        rates: {
          USD: 1,
          CLP: data.rates.CLP,
          ARS: data.rates.ARS,
          PEN: data.rates.PEN,
        },
        fechaActualizacion: new Date().toISOString()
      });
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
    
    const rateFrom = exchangeRate.rates[fromCurrency];
    const rateTo = exchangeRate.rates[toCurrency];
    
    if (!rateFrom || !rateTo) return 0;

    const result = (value / rateFrom) * rateTo;
    
    // Format depending on currency
    if (toCurrency === 'USD' || toCurrency === 'PEN') {
      return result.toFixed(2);
    }
    return result.toFixed(0);
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
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
          <p className="text-[var(--text-secondary)] mt-2">Convierte entre CLP, ARS, PEN y USD en tiempo real.</p>
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
                <select 
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="bg-transparent font-bold text-[var(--text-secondary)] outline-none cursor-pointer"
                >
                  {CURRENCIES.map(c => <option key={c} value={c} className="bg-[var(--bg-solid)] text-[var(--text-primary)]">{c}</option>)}
                </select>
              </div>
            </div>

            {/* Swap Button */}
            <button 
              onClick={handleSwap}
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
                <select 
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="bg-transparent font-bold text-[var(--text-secondary)] outline-none cursor-pointer"
                >
                  {CURRENCIES.map(c => <option key={c} value={c} className="bg-[var(--bg-solid)] text-[var(--text-primary)]">{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-solid)] p-4 rounded-xl border border-[var(--border-subtle)] flex flex-col sm:flex-row justify-between items-center gap-4 text-sm mt-auto">
           <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Activity size={16} />
              <span>
                Referencia temporal (API Externa).
              </span>
           </div>
           {exchangeRate && (
             <div className="text-[var(--text-secondary)] text-xs sm:text-right">
               Última actualización:<br/>
               {new Date(exchangeRate.fechaActualizacion).toLocaleString('es-CL')}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
