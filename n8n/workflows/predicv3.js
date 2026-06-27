const paso = $("Loop Pasos").item?.json || {};
const climaResp = $("GET Clima Actual Paso").item?.json || {};
const estadosResp = $("GET Estados Recientes").item?.json || {};
const alertasResp = $("GET Alertas Vigentes").item?.json || {};

const clima = climaResp?.data?.[0] || null;
const estados = estadosResp?.data || [];
const alertas = alertasResp?.data || [];

function normEstado(e) {
  const raw = (e?.estado_normalizado || e?.estado_general || "")
    .toString()
    .toLowerCase();
  if (raw.includes("cerr") || raw.includes("suspend")) return "cerrado";
  if (raw.includes("precau") || raw.includes("desconocido"))
    return "precaucion";
  if (raw.includes("hab") || raw.includes("abierto")) return "abierto";
  return "desconocido";
}

function riskLabel(prob) {
  if (prob >= 0.7) return "High";
  if (prob >= 0.4) return "Medium";
  return "Low";
}

function predictedState(prob) {
  if (prob >= 0.75) return "cerrado";
  if (prob >= 0.45) return "precaucion";
  return "abierto";
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// WMO weather code risk map
const WEATHER_RISKS = {
  66: { score: 30, label: "freezing rain (high risk)" },
  67: { score: 35, label: "freezing rain (severe)" },
  71: { score: 20, label: "light snow" },
  73: { score: 25, label: "moderate snow" },
  75: { score: 30, label: "heavy snow" },
  77: { score: 20, label: "snow grains" },
  85: { score: 25, label: "snow showers" },
  86: { score: 30, label: "heavy snow showers" },
  95: { score: 20, label: "thunderstorm" },
  96: { score: 25, label: "thunderstorm with hail" },
  99: { score: 30, label: "severe thunderstorm" },
  63: { score: 15, label: "heavy rain" },
  65: { score: 20, label: "very heavy rain" },
  45: { score: 10, label: "fog" },
  48: { score: 12, label: "depositing rime fog" },
};

const now = Date.now();
const hace24h = now - 24 * 60 * 60 * 1000;
const hace3d = now - 3 * 24 * 60 * 60 * 1000;
const hace7d = now - 7 * 24 * 60 * 60 * 1000;

const hist = estados
  .map((e) => {
    const fecha = new Date(e?.fecha_reporte).getTime();
    return {
      estado: normEstado(e),
      fecha: isNaN(fecha) ? 0 : fecha,
      ageDays: (now - fecha) / (1000 * 60 * 60 * 24),
    };
  })
  .filter((h) => h.fecha > 0)
  .sort((a, b) => b.fecha - a.fecha);

const ultimoEstado = hist[0]?.estado || "desconocido";
const alertaVigente = alertas.length > 0;

const rec24h = hist.filter((h) => h.fecha >= hace24h);
const rec3d = hist.filter((h) => h.fecha >= hace3d);
const rec7d = hist.filter((h) => h.fecha >= hace7d);

const cierres24h = rec24h.filter((h) => h.estado === "cerrado").length;
const cierres3d = rec3d.filter((h) => h.estado === "cerrado").length;
const cierres7d = rec7d.filter((h) => h.estado === "cerrado").length;
const prec7d = rec7d.filter((h) => h.estado === "precaucion").length;

// ---- History score calculation ----
let historyScore = 0;
const historyMotives = [];

if (cierres24h >= 1) {
  historyScore += 20;
  historyMotives.push("closure in last 24h");
} else if (cierres3d >= 2) {
  historyScore += 15;
  historyMotives.push("multiple closures in last 3d");
} else if (cierres7d >= 3) {
  historyScore += 12;
  historyMotives.push("frequent closures in last 7d");
} else if (cierres7d >= 1) {
  historyScore += 6;
  historyMotives.push("recent closure history");
}

if (prec7d >= 3) {
  historyScore += 8;
  historyMotives.push("frequent caution history");
} else if (prec7d >= 1) {
  historyScore += 4;
  historyMotives.push("recent caution history");
}

if (ultimoEstado === "cerrado") {
  historyScore += 18;
  historyMotives.push("currently closed");
} else if (ultimoEstado === "precaucion") {
  historyScore += 10;
  historyMotives.push("currently caution");
}

const forecast = Array.isArray(clima?.pronostico_3dias)
  ? clima.pronostico_3dias
  : [];
const dias = [
  { h: 24, d: forecast[0] || null },
  { h: 48, d: forecast[1] || null },
  { h: 72, d: forecast[2] || null },
];

const out = [];

for (const item of dias) {
  const d = item.d || {};
  const tempMin = Number(d?.temp_min ?? clima?.temperatura_actual ?? 0);
  const tempMax = Number(d?.temp_max ?? clima?.temperatura_actual ?? 0);
  const precip = Number(d?.precipitacion ?? clima?.precipitacion_actual ?? 0);
  const viento = Number(d?.viento_max ?? clima?.viento_actual ?? 0);
  const weathercode = Number(d?.weathercode ?? clima?.weathercode ?? 0);

  // ---- Meteorological score ----
  let meteoScore = 0;
  const meteoMotives = [];

  if (WEATHER_RISKS[weathercode]) {
    meteoScore += WEATHER_RISKS[weathercode].score;
    meteoMotives.push(WEATHER_RISKS[weathercode].label);
  }

  if (viento >= 100) {
    meteoScore += 30;
    meteoMotives.push("extreme wind (>100 km/h)");
  } else if (viento >= 80) {
    meteoScore += 25;
    meteoMotives.push("severe wind (80-100 km/h)");
  } else if (viento >= 60) {
    meteoScore += 15;
    meteoMotives.push("strong wind (60-80 km/h)");
  } else if (viento >= 40) {
    meteoScore += 8;
    meteoMotives.push("moderate wind (40-60 km/h)");
  }

  if (precip >= 20) {
    meteoScore += 15;
    meteoMotives.push("very high precipitation");
  } else if (precip >= 10) {
    meteoScore += 10;
    meteoMotives.push("high precipitation");
  } else if (precip >= 4) {
    meteoScore += 5;
    meteoMotives.push("moderate precipitation");
  }

  if (tempMin <= -10) {
    meteoScore += 15;
    meteoMotives.push("extreme cold (<-10°C)");
  } else if (tempMin <= -5) {
    meteoScore += 12;
    meteoMotives.push("severe cold (-10 to -5°C)");
  } else if (tempMin <= 0) {
    meteoScore += 8;
    meteoMotives.push("freezing temperatures (0 to -5°C)");
  } else if (tempMin <= 2) {
    meteoScore += 4;
    meteoMotives.push("near freezing (0 to 2°C)");
  }

  // ---- Context score (altitude) ----
  const altitud = Number(paso?.altitud || 0);
  let contextScore = 0;
  const contextMotives = [];

  if (altitud >= 3000) {
    contextScore += 12;
    contextMotives.push("very high altitude (>3000m)");
  } else if (altitud >= 2500) {
    contextScore += 8;
    contextMotives.push("high altitude (2500-3000m)");
  } else if (altitud >= 1500) {
    contextScore += 4;
    contextMotives.push("moderate altitude (1500-2500m)");
  }

  // Amplify meteorological effects at high altitude
  if (altitud >= 2500 && meteoScore > 0) {
    meteoScore *= 1.15;
  }

  // ---- Alerts score ----
  let alertScore = 0;
  const alertMotives = [];
  const alertaAlta =
    alertaVigente &&
    alertas.some((a) => (a.nivel || "").toLowerCase().includes("alto"));

  if (alertaAlta) {
    alertScore += 15;
    alertMotives.push("high-level active alert");
  } else if (alertaVigente) {
    alertScore += 8;
    alertMotives.push("active alert");
  }

  // ---- Weighted aggregation ----
  const normMeteo = clamp(meteoScore, 0, 100);
  const normHistory = clamp(historyScore, 0, 100);
  const normAlert = clamp(alertScore, 0, 100);
  const normContext = clamp(contextScore, 0, 100);

  const finalScore = clamp(
    normMeteo * 0.4 + normHistory * 0.3 + normAlert * 0.2 + normContext * 0.1,
    0,
    100,
  );

  // Calibrated probability: stretch mid-range to be more decisive
  const rawProb = finalScore / 100;
  const prob = clamp(rawProb * 1.2 - 0.05, 0.05, 0.95);

  // Confidence depends on data quality
  let confidence = "medium";
  if (!clima || !item.d) confidence = "low";
  else if (forecast.length >= 3 && hist.length >= 5) confidence = "high";

  const allMotives = [
    ...meteoMotives,
    ...historyMotives,
    ...alertMotives,
    ...contextMotives,
  ];
  const motiveResumen =
    allMotives.slice(0, 4).join(", ") || "no relevant signals";

  out.push({
    json: {
      paso_id: paso.paso_id,
      paso_documentId: paso.paso_documentId,
      nombre_oficial: paso.nombre_oficial,
      horizonte_horas: item.h,
      probabilidad: Number(prob.toFixed(2)),
      nivel_riesgo: riskLabel(prob),
      estado_predicho: predictedState(prob),
      motivo_resumen: motiveResumen,
      fecha_calculo: new Date().toISOString(),
      valido_desde: new Date().toISOString(),
      valido_hasta: new Date(
        Date.now() + item.h * 60 * 60 * 1000,
      ).toISOString(),
      modelo_version: "risk-v4-weighted",
      tipo_evento: "prediccion_operativa",
      confidence_level: confidence,
      score_desglose: {
        meteo: Math.round(normMeteo),
        historial: Math.round(normHistory),
        alertas: Math.round(normAlert),
        contexto: Math.round(normContext),
        final: Math.round(finalScore),
      },
      datos_entrada: {
        altitud,
        ultimo_estado: ultimoEstado,
        cierres_24h: cierres24h,
        cierres_3d: cierres3d,
        cierres_7d: cierres7d,
        precaucion_7d: prec7d,
        alerta_vigente: alertaVigente,
        alerta_alta: alertaAlta,
        weathercode,
        temp_min: tempMin,
        temp_max: tempMax,
        precipitacion_total: precip,
        viento_max: viento,
        forecast_disponible: !!item.d,
      },
    },
  });
}

return out;
