const paso = $("Loop Pasos").item.json;
const climaResp = $("GET Clima Actual Paso").item.json;
const estadosResp = $("GET Estados Recientes").item.json;
const alertasResp = $("GET Alertas Vigentes").item.json;

const clima = climaResp.data?.[0] || null;
const estados = estadosResp.data || [];
const alertas = alertasResp.data || [];

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
  if (prob >= 0.7) return "Alto";
  if (prob >= 0.4) return "Medio";
  return "Bajo";
}

function predictedState(prob) {
  if (prob >= 0.72) return "cerrado";
  if (prob >= 0.42) return "precaucion";
  return "abierto";
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function alertWeight(a) {
  const txt = JSON.stringify(a || {}).toLowerCase();
  if (txt.includes("crit") || txt.includes("cierre") || txt.includes("emerg"))
    return 1.5;
  if (
    txt.includes("precauc") ||
    txt.includes("viento") ||
    txt.includes("nieve")
  )
    return 1.0;
  return 0.6;
}

const hist = estados
  .map((e) => ({
    estado: normEstado(e),
    motivo: (e.motivo_normalizado || e.motivo_estado || "")
      .toString()
      .toLowerCase(),
    fecha: new Date(e.fecha_reporte).getTime(),
  }))
  .filter((x) => Number.isFinite(x.fecha))
  .sort((a, b) => b.fecha - a.fecha);

const ahora = Date.now();
const hace7Dias = ahora - 7 * 24 * 60 * 60 * 1000;
const reportes7d = hist.filter((x) => x.fecha >= hace7Dias);

const ultimoEstado = hist[0]?.estado || "desconocido";

let histScore = 0;
for (const x of reportes7d) {
  const ageDays = (ahora - x.fecha) / (24 * 60 * 60 * 1000);
  const w = Math.exp(-ageDays / 3.5);
  if (x.estado === "cerrado") histScore += 10 * w;
  if (x.estado === "precaucion") histScore += 5 * w;
  if (x.estado === "abierto") histScore -= 2 * w;
}

const cierres7d = reportes7d.filter((x) => x.estado === "cerrado").length;
const prec7d = reportes7d.filter((x) => x.estado === "precaucion").length;
const alertaVigente = alertas.length > 0;

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

  const tempMin = Number(d.temp_min ?? clima?.temperatura_actual ?? 0);
  const precip = Number(d.precipitacion ?? clima?.precipitacion_actual ?? 0);
  const viento = Number(d.viento_max ?? clima?.viento_actual ?? 0);
  const weathercode = Number(d.weathercode ?? clima?.weathercode ?? 0);

  let score = 0;
  const motivos = [];

  const wmoWeights = {
    66: 24,
    67: 24,
    71: 18,
    73: 22,
    75: 26,
    77: 14,
    85: 20,
    86: 28,
    95: 16,
    96: 20,
    99: 24,
  };

  if (wmoWeights[weathercode]) {
    score += wmoWeights[weathercode];
    if ([66, 67].includes(weathercode)) motivos.push("lluvia engelante");
    else if ([71, 73, 75, 77, 85, 86].includes(weathercode))
      motivos.push("nieve pronosticada");
    else motivos.push("tormenta pronosticada");
  }

  if (viento >= 90) {
    score += 28;
    motivos.push("viento extremo");
  } else if (viento >= 75) {
    score += 20;
    motivos.push("viento muy fuerte");
  } else if (viento >= 60) {
    score += 12;
    motivos.push("viento fuerte");
  } else if (viento >= 40) {
    score += 6;
    motivos.push("viento moderado");
  }

  if (precip >= 15) {
    score += 16;
    motivos.push("precipitacion alta");
  } else if (precip >= 8) {
    score += 10;
    motivos.push("precipitacion moderada");
  } else if (precip >= 3) {
    score += 4;
    motivos.push("precipitacion leve");
  }

  if (tempMin <= -8) {
    score += 10;
    motivos.push("temperatura minima muy baja");
  } else if (tempMin <= -2) {
    score += 5;
    motivos.push("temperatura bajo cero");
  }

  if (Number(paso.altitud || 0) >= 2500) {
    score += 6;
    motivos.push("paso de alta montana");
  }

  if (ultimoEstado === "cerrado") {
    score += 12;
    motivos.push("ultimo estado cerrado");
  } else if (ultimoEstado === "precaucion") {
    score += 7;
    motivos.push("ultimo estado con precaucion");
  }

  if (histScore > 0) {
    score += clamp(histScore, 0, 18);
    motivos.push("historial reciente adverso");
  } else if (histScore < 0) {
    score += histScore;
  }

  if (cierres7d >= 3) {
    score += 8;
    motivos.push("cierres frecuentes recientes");
  } else if (cierres7d >= 1) {
    score += 4;
    motivos.push("cierres recientes");
  }

  if (prec7d >= 2) {
    score += 4;
    motivos.push("antecedentes de precaucion");
  }

  if (alertaVigente) {
    const alertScore = alertas.reduce((acc, a) => acc + alertWeight(a), 0);
    score += clamp(alertScore * 4, 4, 16);
    motivos.push("alerta vigente");
  }

  const altitudBoost = Number(paso.altitud || 0) >= 3000 ? 4 : 0;
  score += altitudBoost;

  score = clamp(score, -10, 100);

  const prob = clamp(sigmoid((score - 42) / 12), 0.05, 0.95);

  out.push({
    json: {
      paso_id: paso.paso_id,
      paso_documentId: paso.paso_documentId,
      nombre_oficial: paso.nombre_oficial,
      horizonte_horas: item.h,
      probabilidad: Number(prob.toFixed(2)),
      nivel_riesgo: riskLabel(prob),
      estado_predicho: predictedState(prob),
      motivo_resumen:
        motivos.slice(0, 4).join(", ") || "sin señales relevantes",
      fecha_calculo: new Date().toISOString(),
      valido_desde: new Date().toISOString(),
      valido_hasta: new Date(
        Date.now() + item.h * 60 * 60 * 1000,
      ).toISOString(),
      modelo_version: "risk-v3-rules",
      tipo_evento: "prediccion_operativa",
      datos_entrada: {
        altitud: paso.altitud,
        ultimo_estado: ultimoEstado,
        cierres_7d: cierres7d,
        precaucion_7d: prec7d,
        alerta_vigente: alertaVigente,
        weathercode,
        temp_min: tempMin,
        precipitacion_total: precip,
        viento_max: viento,
      },
    },
  });
}

return out;
