// ============================================================
// MODELO HÍBRIDO v6.1 (FAST) — FrontierAdvice Predicción
// Optimizado para leer 3 nodos HTTP de historial paralelos
// en vez de 1 rango continuo masivo de 4 años.
// ============================================================

const paso         = $("Loop Pasos").item?.json           || {};
const climaResp    = $("GET Clima Actual Paso").item?.json || {};
const estadosResp  = $("GET Estados Recientes").item?.json || {};
const alertasResp  = $("GET Alertas Vigentes").item?.json  || {};

// Leemos los 3 nodos paralelos
const hist1 = $("GET Clima Histórico -1 Año").item?.json?.daily || {};
const hist2 = $("GET Clima Histórico -2 Años").item?.json?.daily || {};
const hist3 = $("GET Clima Histórico -3 Años").item?.json?.daily || {};

const clima    = climaResp?.data?.[0]             || null;
const estados  = Array.isArray(estadosResp?.data)  ? estadosResp.data  : [];
const alertas  = Array.isArray(alertasResp?.data)  ? alertasResp.data  : [];

// ── Concatenar históricos ────────────────────────────────────────────────────
const histTimes = [
  ...(Array.isArray(hist1.time) ? hist1.time : []),
  ...(Array.isArray(hist2.time) ? hist2.time : []),
  ...(Array.isArray(hist3.time) ? hist3.time : [])
];
const histTempMin = [
  ...(Array.isArray(hist1.temperature_2m_min) ? hist1.temperature_2m_min : []),
  ...(Array.isArray(hist2.temperature_2m_min) ? hist2.temperature_2m_min : []),
  ...(Array.isArray(hist3.temperature_2m_min) ? hist3.temperature_2m_min : [])
];
const histPrecip = [
  ...(Array.isArray(hist1.precipitation_sum) ? hist1.precipitation_sum : []),
  ...(Array.isArray(hist2.precipitation_sum) ? hist2.precipitation_sum : []),
  ...(Array.isArray(hist3.precipitation_sum) ? hist3.precipitation_sum : [])
];
const histViento = [
  ...(Array.isArray(hist1.windspeed_10m_max) ? hist1.windspeed_10m_max : []),
  ...(Array.isArray(hist2.windspeed_10m_max) ? hist2.windspeed_10m_max : []),
  ...(Array.isArray(hist3.windspeed_10m_max) ? hist3.windspeed_10m_max : [])
];
const histWMO = [
  ...(Array.isArray(hist1.weather_code) ? hist1.weather_code : []),
  ...(Array.isArray(hist2.weather_code) ? hist2.weather_code : []),
  ...(Array.isArray(hist3.weather_code) ? hist3.weather_code : [])
];

const WMO_PELIGROSOS = new Set([66, 67, 71, 73, 75, 77, 85, 86, 95, 96, 99]);

function stats(arr) {
  const valid = arr.filter((v) => v !== null && v !== undefined && Number.isFinite(Number(v)));
  if (valid.length === 0) return { mean: null, std: null, n: 0 };
  const n    = valid.length;
  const mean = valid.reduce((s, v) => s + Number(v), 0) / n;
  const std  = Math.sqrt(valid.reduce((s, v) => s + Math.pow(Number(v) - mean, 2), 0) / n);
  return { mean, std, n };
}

// Ahora buscamos en la colección de ~21 a 30 días concatenados
function getHistoricoParaFecha(targetDateISO) {
  const target = new Date(targetDateISO + "T12:00:00Z");
  const targetMM = target.getUTCMonth() + 1;
  const targetDD = target.getUTCDate();

  const tempMins = [], precips = [], vientos = [], wmos = [];

  for (let i = 0; i < histTimes.length; i++) {
    const d = new Date(histTimes[i] + "T12:00:00Z");
    if (d.getUTCMonth() + 1 === targetMM && d.getUTCDate() === targetDD) {
      if (histTempMin[i]  !== null) tempMins.push(Number(histTempMin[i]));
      if (histPrecip[i]   !== null) precips.push(Number(histPrecip[i]));
      if (histViento[i]   !== null) vientos.push(Number(histViento[i]));
      if (histWMO[i]      !== null) wmos.push(Number(histWMO[i]));
    }
  }

  return { tempMins, precips, vientos, wmos };
}

function anomaliaSigma(valorActual, mean, std) {
  if (mean === null || std === null || std === 0) return null;
  return (valorActual - mean) / std;
}

// ── Utilidades generales ──────────────────────────────────────────────────────
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
function normEstado(e) {
  const raw = (e?.estado_normalizado || e?.estado_general || "").toString().toLowerCase();
  if (raw.includes("cerr") || raw.includes("suspend")) return "cerrado";
  if (raw.includes("precau") || raw.includes("desconocido")) return "precaucion";
  if (raw.includes("hab") || raw.includes("abierto")) return "abierto";
  return "desconocido";
}
function riskLabel(prob) {
  if (prob >= 0.70) return "Alto";
  if (prob >= 0.40) return "Medio";
  return "Bajo";
}
function predictedState(prob, hardSignals = 0) {
  if (prob >= 0.72 || hardSignals >= 2) return "cerrado";
  if (prob >= 0.42) return "precaucion";
  return "abierto";
}

// ── Tabla WMO ────────────────────────────────────────────────────────────────
const WMO_RISKS = {
  45: { score: 8,  label: "niebla",                   hard: false },
  48: { score: 10, label: "niebla engelante",          hard: false },
  66: { score: 28, label: "lluvia engelante moderada", hard: true  },
  67: { score: 34, label: "lluvia engelante intensa",  hard: true  },
  71: { score: 16, label: "nevada leve",               hard: false },
  73: { score: 22, label: "nevada moderada",           hard: true  },
  75: { score: 28, label: "nevada intensa",            hard: true  },
  77: { score: 14, label: "granizo menudo",            hard: false },
  85: { score: 20, label: "chubascos de nieve",        hard: false },
  86: { score: 30, label: "chubascos de nieve intensos", hard: true },
  95: { score: 18, label: "tormenta",                  hard: false },
  96: { score: 24, label: "tormenta con granizo",      hard: true  },
  99: { score: 30, label: "tormenta severa",           hard: true  },
  63: { score: 14, label: "lluvia intensa",            hard: false },
  65: { score: 18, label: "lluvia muy intensa",        hard: true  },
};

// ── Pre-cálculo del historial operativo ──────────────────────────────────────
const now     = Date.now();
const hace24h = now - 1 * 24 * 60 * 60 * 1000;
const hace3d  = now - 3 * 24 * 60 * 60 * 1000;
const hace7d  = now - 7 * 24 * 60 * 60 * 1000;

const hist = estados
  .map((e) => {
    const fecha = new Date(e?.fecha_reporte).getTime();
    const motivo = (e?.motivo_estado || e?.mensaje_original || "").toString().toLowerCase();
    return { estado: normEstado(e), fecha: isNaN(fecha) ? 0 : fecha, motivo };
  })
  .filter((h) => h.fecha > 0)
  .sort((a, b) => b.fecha - a.fecha);

const ultimoEstado  = hist[0]?.estado || "desconocido";
const ultimoMotivo  = hist[0]?.motivo || "";

// Detección de cierres estructurales/estacionales prolongados
const isCierreEstructural = ultimoEstado === "cerrado" && (
  ultimoMotivo.includes("temporada estival") ||
  ultimoMotivo.includes("temporada invernal") ||
  ultimoMotivo.includes("invierno") ||
  ultimoMotivo.includes("indefinido") ||
  ultimoMotivo.includes("reparación") ||
  ultimoMotivo.includes("mantenimiento") ||
  ultimoMotivo.includes("mantención") ||
  ultimoMotivo.includes("obras") ||
  ultimoMotivo.includes("sistema de agua") ||
  ultimoMotivo.includes("estructural")
);

const alertaVigente = alertas.length > 0;
const alertaAlta    = alertaVigente && alertas.some((a) => {
    const txt = JSON.stringify(a).toLowerCase();
    return txt.includes("alto") || txt.includes("critico") || txt.includes("emerg");
});

const rec24h = hist.filter((h) => h.fecha >= hace24h);
const rec3d  = hist.filter((h) => h.fecha >= hace3d);
const rec7d  = hist.filter((h) => h.fecha >= hace7d);

const cierres24h = rec24h.filter((h) => h.estado === "cerrado").length;
const cierres3d  = rec3d.filter((h)  => h.estado === "cerrado").length;
const cierres7d  = rec7d.filter((h)  => h.estado === "cerrado").length;
const prec7d     = rec7d.filter((h)  => h.estado === "precaucion").length;

function calcHistoryScore(motivos) {
  let score = 0;
  
  if (isCierreEstructural) {
    score = 60; // Penalización masiva, sobreescribe el resto
    motivos.push("cierre estructural/estacional prolongado");
    return score;
  }

  if (cierres24h >= 1)     { score += 22; motivos.push("cierre en las últimas 24h"); }
  else if (cierres3d >= 2) { score += 16; motivos.push("múltiples cierres en 3 días"); }
  else if (cierres7d >= 3) { score += 12; motivos.push("cierres frecuentes en 7 días"); }
  else if (cierres7d >= 1) { score += 6;  motivos.push("cierres recientes"); }
  if (prec7d >= 3)         { score += 8;  motivos.push("precauciones frecuentes"); }
  else if (prec7d >= 1)    { score += 4;  motivos.push("antecedentes de precaución"); }
  if (ultimoEstado === "cerrado")    { score += 18; motivos.push("último estado: cerrado"); }
  else if (ultimoEstado === "precaucion") { score += 10; motivos.push("último estado: precaución"); }
  return clamp(score, 0, 30);
}

// ── Pronóstico 3 días ─────────────────────────────────────────────────────────
const forecast = Array.isArray(clima?.pronostico_3dias) ? clima.pronostico_3dias : [];

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const hoy = new Date().toISOString().slice(0, 10);
const dias = [
  { h: 24, d: forecast[0] || null, horizonWeight: 1.00, fecha: addDays(hoy, 1) },
  { h: 48, d: forecast[1] || null, horizonWeight: 0.85, fecha: addDays(hoy, 2) },
  { h: 72, d: forecast[2] || null, horizonWeight: 0.72, fecha: addDays(hoy, 3) },
];

const altitud = Number(paso?.altitud || 0);
const out = [];

for (const item of dias) {
  const d = item.d || {};

  const tempMin    = Number(d.temp_min      ?? clima?.temperatura_actual ?? 0);
  const precip     = Number(d.precipitacion ?? clima?.precipitacion_actual ?? 0);
  const viento     = Number(d.viento_max    ?? clima?.viento_actual ?? 0);
  const weathercode = Number(d.weathercode  ?? clima?.weathercode ?? 0);

  const motivos = [];
  let hardSignals = 0;

  // ── 1. Score Meteorológico ──────────────────────────────────
  let meteoScore = 0;

  const wmo = WMO_RISKS[weathercode];
  if (wmo) {
    meteoScore += wmo.score;
    motivos.push(wmo.label);
    if (wmo.hard) hardSignals++;
  }

  if (viento >= 100)      { meteoScore += 30; hardSignals++; motivos.push("viento extremo (>100 km/h)"); }
  else if (viento >= 80)  { meteoScore += 22; motivos.push("viento muy fuerte (80-100 km/h)"); }
  else if (viento >= 60)  { meteoScore += 14; motivos.push("viento fuerte (60-80 km/h)"); }
  else if (viento >= 40)  { meteoScore += 7;  motivos.push("viento moderado (40-60 km/h)"); }

  if (precip >= 20)       { meteoScore += 14; motivos.push("precipitación muy alta"); }
  else if (precip >= 12)  { meteoScore += 10; motivos.push("precipitación alta"); }
  else if (precip >= 5)   { meteoScore += 6;  motivos.push("precipitación moderada"); }
  else if (precip >= 2)   { meteoScore += 3;  motivos.push("precipitación leve"); }

  if (tempMin <= -10)     { meteoScore += 14; motivos.push("frío extremo (<-10°C)"); }
  else if (tempMin <= -5) { meteoScore += 10; motivos.push("temperatura muy baja (-10 a -5°C)"); }
  else if (tempMin <= 0)  { meteoScore += 6;  motivos.push("temperatura bajo cero"); }
  else if (tempMin <= 2)  { meteoScore += 3;  motivos.push("temperatura cercana a cero"); }

  if (altitud >= 2500 && meteoScore > 0) {
    meteoScore *= 1.15;
    motivos.push("amplificación alta montaña");
  }
  meteoScore = clamp(meteoScore, 0, 60);

  // ── 2. Score Anomalía Climática Histórica ──────────────────
  let anomaliaScore = 0;
  const historicoDia = getHistoricoParaFecha(item.fecha);

  const stTempMin = stats(historicoDia.tempMins);
  const stPrecip  = stats(historicoDia.precips);
  const stViento  = stats(historicoDia.vientos);
  const nHistDias = stTempMin.n;

  const anomTempSigma = anomaliaSigma(tempMin, stTempMin.mean, stTempMin.std);
  if (anomTempSigma !== null && anomTempSigma <= -2.0) {
    anomaliaScore += 12; hardSignals++; motivos.push("temperatura anormalmente baja (>2σ)");
  } else if (anomTempSigma !== null && anomTempSigma <= -1.5) {
    anomaliaScore += 8;  motivos.push("temperatura significativamente bajo lo normal");
  } else if (anomTempSigma !== null && anomTempSigma <= -1.0) {
    anomaliaScore += 4;  motivos.push("temperatura bajo lo normal");
  }

  const anomPrecipSigma = anomaliaSigma(precip, stPrecip.mean, stPrecip.std);
  if (anomPrecipSigma !== null && anomPrecipSigma >= 2.0) {
    anomaliaScore += 10; hardSignals++; motivos.push("precipitación anormalmente alta (>2σ)");
  } else if (anomPrecipSigma !== null && anomPrecipSigma >= 1.5) {
    anomaliaScore += 6;  motivos.push("precipitación significativamente sobre lo normal");
  } else if (anomPrecipSigma !== null && anomPrecipSigma >= 1.0) {
    anomaliaScore += 3;  motivos.push("precipitación sobre lo normal");
  }

  const anomVientoSigma = anomaliaSigma(viento, stViento.mean, stViento.std);
  if (anomVientoSigma !== null && anomVientoSigma >= 2.0) {
    anomaliaScore += 8; motivos.push("viento anormalmente alto (>2σ)");
  } else if (anomVientoSigma !== null && anomVientoSigma >= 1.5) {
    anomaliaScore += 4; motivos.push("viento sobre lo normal");
  }

  const diasPeligrosos = historicoDia.wmos.filter((w) => WMO_PELIGROSOS.has(w)).length;
  const pctEstacional  = historicoDia.wmos.length > 0 ? diasPeligrosos / historicoDia.wmos.length : 0;

  if (pctEstacional >= 0.6) {
    anomaliaScore += 8; motivos.push("semana de alto riesgo estacional histórico");
  } else if (pctEstacional >= 0.35) {
    anomaliaScore += 4; motivos.push("semana de riesgo estacional moderado");
  }

  anomaliaScore = clamp(anomaliaScore, 0, 25);

  // ── 3. Score Altitud-Contexto ───────────────────────────────
  let contextScore = 0;
  if (altitud >= 3000)      { contextScore = 12; motivos.push("paso sobre 3000 m.s.n.m."); }
  else if (altitud >= 2500) { contextScore = 8;  motivos.push("paso de alta montaña (>2500 m)"); }
  else if (altitud >= 1500) { contextScore = 4;  motivos.push("paso de montaña media"); }

  // ── 4. Score Historial Operativo ────────────────────────────
  const historyScore = calcHistoryScore(motivos);
  if (ultimoEstado === "cerrado") {
    if (isCierreEstructural) hardSignals += 3; // Fuerza cierre seguro
    else hardSignals++;
  }

  // ── 5. Score Alertas ───────────────────────────────────────
  let alertScore = 0;
  if (alertaAlta)      { alertScore = 15; hardSignals++; motivos.push("alerta de nivel alto vigente"); }
  else if (alertaVigente) { alertScore = 8; motivos.push("alerta vigente"); }

  // ── 6. Agregación ponderada ────────────────────────────────────────────────
  const normMeteo    = (meteoScore    / 60)  * 100;
  const normHistory  = (historyScore  / (isCierreEstructural ? 60 : 30))  * 100;
  const normAnomalia = (anomaliaScore / 25)  * 100;
  const normAlerts   = (alertScore    / 15)  * 100;
  const normContext  = (contextScore  / 12)  * 100;

  let weightedScore = 0;
  
  if (isCierreEstructural) {
     weightedScore = 95; // Si está cerrado por temporada/estructural, la probabilidad global es altísima siempre.
  } else {
     weightedScore = clamp(
      normMeteo    * 0.40 +
      normHistory  * 0.25 +
      normAnomalia * 0.20 +
      normAlerts   * 0.10 +
      normContext  * 0.05,
      0, 100
    );
  }

  const horizonAdjusted = weightedScore * item.horizonWeight;
  const rawProb = sigmoid((horizonAdjusted - 42) / 12);
  const prob    = clamp(rawProb, 0.05, 0.95);

  let confidence = "media";
  if (!clima || !item.d || nHistDias < 2)        confidence = "baja";
  else if (forecast.length >= 3 && nHistDias >= 2 && hist.length >= 5) confidence = "alta";

  out.push({
    json: {
      paso_id:         paso.paso_id,
      paso_documentId: paso.paso_documentId,
      nombre_oficial:  paso.nombre_oficial,
      horizonte_horas: item.h,
      probabilidad:    Number(prob.toFixed(2)),
      nivel_riesgo:    riskLabel(prob),
      estado_predicho: predictedState(prob, hardSignals),
      motivo_resumen:  motivos.slice(0, 5).join(", ") || "sin señales relevantes",
      fecha_calculo:   new Date().toISOString(),
      valido_desde:    new Date().toISOString(),
      valido_hasta:    new Date(Date.now() + item.h * 60 * 60 * 1000).toISOString(),
      modelo_version:  "risk-v6-hybrid-fast",
      tipo_evento:     "prediccion_operativa",
      confianza:       confidence,
      score_desglose: {
        meteo:              Math.round(meteoScore),
        anomalia_climatica: Math.round(anomaliaScore),
        historial:          Math.round(historyScore),
        alertas:            Math.round(alertScore),
        contexto:           Math.round(contextScore),
        ponderado:          Math.round(weightedScore),
        ajustado_horizonte: Math.round(horizonAdjusted),
        hard_signals:       hardSignals,
        dias_historicos:    nHistDias,
        pct_estacional:     Math.round(pctEstacional * 100),
      },
      datos_entrada: {
        altitud,
        ultimo_estado:         ultimoEstado,
        cierres_24h:           cierres24h,
        cierres_3d:            cierres3d,
        cierres_7d:            cierres7d,
        precaucion_7d:         prec7d,
        alerta_vigente:        alertaVigente,
        alerta_alta:           alertaAlta,
        weathercode,
        temp_min:              tempMin,
        precipitacion_total:   precip,
        viento_max:            viento,
        forecast_disponible:   !!item.d,
        historico_temp_media:  stTempMin.mean !== null ? Number(stTempMin.mean.toFixed(1)) : null,
        historico_precip_media: stPrecip.mean !== null ? Number(stPrecip.mean.toFixed(1)) : null,
        anomalia_temp_sigma:   anomTempSigma  !== null ? Number(anomTempSigma.toFixed(2))  : null,
        anomalia_precip_sigma: anomPrecipSigma !== null ? Number(anomPrecipSigma.toFixed(2)) : null,
      },
    },
  });
}

return out;
