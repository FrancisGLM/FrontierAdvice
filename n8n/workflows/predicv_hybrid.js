// ============================================================
// MODELO HÍBRIDO — FrontierAdvice Predicción v5
// Combina lo mejor de v1, v2, v3 y v4:
//   - Ponderación por categorías con caps individuales (v3/v4)
//   - Sigmoid suavizada para probabilidad (v1)
//   - Ventanas temporales escalonadas 24h/3d/7d (v3)
//   - Degradación de confianza por horizonte (v2)
//   - hardSignals override (v2/v4)
//   - Amplificación altitud sobre meteo (v3)
//   - score_desglose para trazabilidad (v3)
//   - Motivos en español ✅
//   - Seguro sin altitud en BD (altitud=0 → sin boost) ✅
// ============================================================

const paso       = $("Loop Pasos").item?.json        || {};
const climaResp  = $("GET Clima Actual Paso").item?.json  || {};
const estadosResp = $("GET Estados Recientes").item?.json || {};
const alertasResp = $("GET Alertas Vigentes").item?.json  || {};

const clima   = climaResp?.data?.[0]            || null;
const estados = Array.isArray(estadosResp?.data) ? estadosResp.data : [];
const alertas = Array.isArray(alertasResp?.data) ? alertasResp.data : [];

// ── Utilidades ────────────────────────────────────────────────────────────────

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Sigmoid centrada: convierte un score bruto en una probabilidad [0,1]
 * de forma suave. Centro=42, escala=12 → score 42 ≈ prob 0.50
 * Tomado de v1 (mejor que lineal score/100).
 */
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function normEstado(e) {
  const raw = (e?.estado_normalizado || e?.estado_general || "")
    .toString().toLowerCase();
  if (raw.includes("cerr")   || raw.includes("suspend")) return "cerrado";
  if (raw.includes("precau") || raw.includes("desconocido")) return "precaucion";
  if (raw.includes("hab")    || raw.includes("abierto"))  return "abierto";
  return "desconocido";
}

function riskLabel(prob) {
  if (prob >= 0.70) return "Alto";
  if (prob >= 0.40) return "Medio";
  return "Bajo";
}

/**
 * Estado predicho: usa probabilidad + override por señales críticas (v2/v4).
 * Si hay ≥2 señales de alta severidad, se fuerza "cerrado" aunque prob sea media.
 */
function predictedState(prob, hardSignals = 0) {
  if (prob >= 0.72 || hardSignals >= 2) return "cerrado";
  if (prob >= 0.42)                     return "precaucion";
  return "abierto";
}

// ── Pre-cálculo del historial (ventanas 24h / 3d / 7d) ───────────────────────
// Tomado de v3: más granular que solo mirar 7d.

const now      = Date.now();
const hace24h  = now - 1  * 24 * 60 * 60 * 1000;
const hace3d   = now - 3  * 24 * 60 * 60 * 1000;
const hace7d   = now - 7  * 24 * 60 * 60 * 1000;

const hist = estados
  .map((e) => {
    const fecha = new Date(e?.fecha_reporte).getTime();
    return {
      estado: normEstado(e),
      fecha:  isNaN(fecha) ? 0 : fecha,
    };
  })
  .filter((h) => h.fecha > 0)
  .sort((a, b) => b.fecha - a.fecha);

const ultimoEstado = hist[0]?.estado || "desconocido";
const alertaVigente = alertas.length > 0;

// Indicador de alerta de nivel "alto" explícito (v3)
const alertaAlta = alertaVigente &&
  alertas.some((a) => {
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

/**
 * Score de historial con decaimiento por recencia (v4 + v1).
 * Cierres en las últimas 24h tienen el mayor peso; el peso baja con la edad.
 * Cap individual: 30 puntos máximos para que el historial no "tape" la meteorología.
 */
function calcHistoryScore(motivos) {
  let score = 0;

  // Ventanas escalonadas (v3)
  if (cierres24h >= 1) {
    score += 22; motivos.push("cierre en las últimas 24h");
  } else if (cierres3d >= 2) {
    score += 16; motivos.push("múltiples cierres en 3 días");
  } else if (cierres7d >= 3) {
    score += 12; motivos.push("cierres frecuentes en 7 días");
  } else if (cierres7d >= 1) {
    score += 6;  motivos.push("cierres recientes");
  }

  if (prec7d >= 3) {
    score += 8; motivos.push("precauciones frecuentes");
  } else if (prec7d >= 1) {
    score += 4; motivos.push("antecedentes de precaución");
  }

  if (ultimoEstado === "cerrado") {
    score += 18; motivos.push("último estado: cerrado");
  } else if (ultimoEstado === "precaucion") {
    score += 10; motivos.push("último estado: precaución");
  }

  return clamp(score, 0, 30); // Cap de categoría: 30 pts
}

// ── Tabla WMO (v1 + v3 combinadas, más granular) ─────────────────────────────
const WMO_RISKS = {
  45: { score: 8,  label: "niebla" },
  48: { score: 10, label: "niebla engelante" },
  66: { score: 28, label: "lluvia engelante moderada", hard: true  },
  67: { score: 34, label: "lluvia engelante intensa",  hard: true  },
  71: { score: 16, label: "nevada leve" },
  73: { score: 22, label: "nevada moderada",            hard: true  },
  75: { score: 28, label: "nevada intensa",             hard: true  },
  77: { score: 14, label: "granizo menudo" },
  85: { score: 20, label: "chubascos de nieve" },
  86: { score: 30, label: "chubascos de nieve intensos", hard: true },
  95: { score: 18, label: "tormenta" },
  96: { score: 24, label: "tormenta con granizo",       hard: true  },
  99: { score: 30, label: "tormenta severa",            hard: true  },
  63: { score: 14, label: "lluvia intensa" },
  65: { score: 18, label: "lluvia muy intensa",         hard: true  },
};

// ── Pronóstico 3 días ─────────────────────────────────────────────────────────
const forecast = Array.isArray(clima?.pronostico_3dias)
  ? clima.pronostico_3dias
  : [];

/**
 * Peso por horizonte temporal (v2):
 * El pronóstico de 48h y 72h es más incierto → reduce su contribución.
 */
const dias = [
  { h: 24, d: forecast[0] || null, horizonWeight: 1.00 },
  { h: 48, d: forecast[1] || null, horizonWeight: 0.85 },
  { h: 72, d: forecast[2] || null, horizonWeight: 0.72 },
];

// ── Altitud del paso ──────────────────────────────────────────────────────────
const altitud = Number(paso?.altitud || 0);

// ── Loop por día ──────────────────────────────────────────────────────────────
const out = [];

for (const item of dias) {
  const d = item.d || {};

  const tempMin    = Number(d.temp_min      ?? clima?.temperatura_actual ?? 0);
  const precip     = Number(d.precipitacion ?? clima?.precipitacion_actual ?? 0);
  const viento     = Number(d.viento_max    ?? clima?.viento_actual ?? 0);
  const weathercode = Number(d.weathercode  ?? clima?.weathercode ?? 0);

  const motivos = [];
  let hardSignals = 0;

  // ── 1. Score Meteorológico (cap: 60 pts) ──────────────────────────────────
  let meteoScore = 0;

  // WMO weathercode (v1 tabla granular + v3 flag hard)
  const wmo = WMO_RISKS[weathercode];
  if (wmo) {
    meteoScore += wmo.score;
    motivos.push(wmo.label);
    if (wmo.hard) hardSignals++;
  }

  // Viento (v1 umbrales + v3 techo 100)
  if (viento >= 100) {
    meteoScore += 30; hardSignals++; motivos.push("viento extremo (>100 km/h)");
  } else if (viento >= 80) {
    meteoScore += 22; motivos.push("viento muy fuerte (80-100 km/h)");
  } else if (viento >= 60) {
    meteoScore += 14; motivos.push("viento fuerte (60-80 km/h)");
  } else if (viento >= 40) {
    meteoScore += 7;  motivos.push("viento moderado (40-60 km/h)");
  }

  // Precipitación
  if (precip >= 20) {
    meteoScore += 14; motivos.push("precipitación muy alta");
  } else if (precip >= 12) {
    meteoScore += 10; motivos.push("precipitación alta");
  } else if (precip >= 5) {
    meteoScore += 6;  motivos.push("precipitación moderada");
  } else if (precip >= 2) {
    meteoScore += 3;  motivos.push("precipitación leve");
  }

  // Temperatura mínima (v3 umbrales más finos)
  if (tempMin <= -10) {
    meteoScore += 14; motivos.push("frío extremo (<-10°C)");
  } else if (tempMin <= -5) {
    meteoScore += 10; motivos.push("temperatura muy baja (-10 a -5°C)");
  } else if (tempMin <= 0) {
    meteoScore += 6;  motivos.push("temperatura bajo cero");
  } else if (tempMin <= 2) {
    meteoScore += 3;  motivos.push("temperatura cercana a cero");
  }

  // Amplificación altitud (v3): alta montaña potencia los efectos meteo
  if (altitud >= 2500 && meteoScore > 0) {
    meteoScore *= 1.15;
    motivos.push("amplificación por alta montaña");
  }

  meteoScore = clamp(meteoScore, 0, 60);

  // ── 2. Score Altitud-Contexto (cap: 12 pts) ───────────────────────────────
  let contextScore = 0;
  if (altitud >= 3000) {
    contextScore = 12; motivos.push("paso sobre 3000 m.s.n.m.");
  } else if (altitud >= 2500) {
    contextScore = 8;  motivos.push("paso de alta montaña (>2500 m)");
  } else if (altitud >= 1500) {
    contextScore = 4;  motivos.push("paso de montaña media");
  }
  // Si altitud = 0 (sin dato en BD) → contextScore = 0 ✅

  // ── 3. Score Historial (cap: 30 pts) ─────────────────────────────────────
  const historyScore = calcHistoryScore(motivos);
  if (ultimoEstado === "cerrado") hardSignals++;

  // ── 4. Score Alertas (cap: 15 pts) ───────────────────────────────────────
  let alertScore = 0;
  if (alertaAlta) {
    alertScore = 15; hardSignals++; motivos.push("alerta de nivel alto vigente");
  } else if (alertaVigente) {
    alertScore = 8;  motivos.push("alerta vigente");
  }

  // ── 5. Agregación ponderada (v3 estructura) ───────────────────────────────
  // Pesos: meteo 45% | historial 30% | alertas 15% | contexto 10%
  // Cada categoría ya está normalizada a su propio rango con cap.
  // Para la ponderación los normalizamos a /100 primero.
  const normMeteo    = (meteoScore   / 60)  * 100;
  const normHistory  = (historyScore / 30)  * 100;
  const normAlerts   = (alertScore   / 15)  * 100;
  const normContext  = (contextScore / 12)  * 100;

  const weightedScore = clamp(
    normMeteo   * 0.45 +
    normHistory * 0.30 +
    normAlerts  * 0.15 +
    normContext * 0.10,
    0, 100
  );

  // Aplicar peso del horizonte temporal (v2): horizontes lejanos reducen la certeza
  const horizonAdjusted = weightedScore * item.horizonWeight;

  // ── 6. Conversión a probabilidad con sigmoid (v1) ─────────────────────────
  // sigmoid((score - 42) / 12) → transición suave en el punto crítico
  const rawProb = sigmoid((horizonAdjusted - 42) / 12);
  const prob    = clamp(rawProb, 0.05, 0.95);

  // ── 7. Confianza del dato (v3) ────────────────────────────────────────────
  let confidence = "media";
  if (!clima || !item.d)                           confidence = "baja";
  else if (forecast.length >= 3 && hist.length >= 5) confidence = "alta";

  // ── Salida ────────────────────────────────────────────────────────────────
  out.push({
    json: {
      paso_id:          paso.paso_id,
      paso_documentId:  paso.paso_documentId,
      nombre_oficial:   paso.nombre_oficial,
      horizonte_horas:  item.h,
      probabilidad:     Number(prob.toFixed(2)),
      nivel_riesgo:     riskLabel(prob),
      estado_predicho:  predictedState(prob, hardSignals),
      motivo_resumen:   motivos.slice(0, 5).join(", ") || "sin señales relevantes",
      fecha_calculo:    new Date().toISOString(),
      valido_desde:     new Date().toISOString(),
      valido_hasta:     new Date(Date.now() + item.h * 60 * 60 * 1000).toISOString(),
      modelo_version:   "risk-v5-hybrid",
      tipo_evento:      "prediccion_operativa",
      confianza:        confidence,
      // Desglose para debug/trazabilidad (v3)
      score_desglose: {
        meteo:             Math.round(meteoScore),
        historial:         Math.round(historyScore),
        alertas:           Math.round(alertScore),
        contexto:          Math.round(contextScore),
        ponderado:         Math.round(weightedScore),
        ajustado_horizonte: Math.round(horizonAdjusted),
        hard_signals:      hardSignals,
      },
      datos_entrada: {
        altitud,
        ultimo_estado:       ultimoEstado,
        cierres_24h:         cierres24h,
        cierres_3d:          cierres3d,
        cierres_7d:          cierres7d,
        precaucion_7d:       prec7d,
        alerta_vigente:      alertaVigente,
        alerta_alta:         alertaAlta,
        weathercode,
        temp_min:            tempMin,
        precipitacion_total: precip,
        viento_max:          viento,
        forecast_disponible: !!item.d,
      },
    },
  });
}

return out;
