const paso = $("Loop Pasos").item.json;
const climaResp = $("GET Clima Actual Paso").item.json;
const estadosResp = $("GET Estados Recientes").item.json;
const alertasResp = $("GET Alertas Vigentes").item.json;

const clima = climaResp.data?.[0] || null;
const estados = Array.isArray(estadosResp.data) ? estadosResp.data : [];
const alertas = Array.isArray(alertasResp.data) ? alertasResp.data : [];

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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function riskLabel(prob) {
  if (prob >= 0.72) return "Alto";
  if (prob >= 0.42) return "Medio";
  return "Bajo";
}

function predictedState(prob, score, strongSignals) {
  if (prob >= 0.78 || strongSignals >= 2) return "cerrado";
  if (prob >= 0.45) return "precaucion";
  return "abierto";
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

const hace7Dias = Date.now() - 7 * 24 * 60 * 60 * 1000;
const reportes7d = hist.filter((x) => x.fecha >= hace7Dias);

const cierres7d = reportes7d.filter((x) => x.estado === "cerrado").length;
const prec7d = reportes7d.filter((x) => x.estado === "precaucion").length;
const ultimoEstado = hist[0]?.estado || "desconocido";
const alertaVigente = alertas.length > 0;

const forecast = Array.isArray(clima?.pronostico_3dias)
  ? clima.pronostico_3dias
  : [];
const dias = [
  { h: 24, d: forecast[0] || null, weight: 1.0 },
  { h: 48, d: forecast[1] || null, weight: 0.85 },
  { h: 72, d: forecast[2] || null, weight: 0.72 },
];

const out = [];

for (const item of dias) {
  const d = item.d || {};

  const tempMin = Number(d.temp_min ?? clima?.temperatura_actual ?? 0);
  const precip = Number(d.precipitacion ?? clima?.precipitacion_actual ?? 0);
  const viento = Number(d.viento_max ?? clima?.viento_actual ?? 0);
  const weathercode = Number(d.weathercode ?? clima?.weathercode ?? 0);

  let score = 0;
  let strongSignals = 0;
  const motivos = [];

  const severeSnow = [71, 73, 75, 77, 85, 86];
  const severeRain = [63, 65];
  const severeStorm = [95, 96, 99];
  const freezingRain = [66, 67];

  if (freezingRain.includes(weathercode)) {
    score += 32;
    strongSignals += 1;
    motivos.push("lluvia engelante");
  }

  if (severeSnow.includes(weathercode)) {
    score += 30;
    strongSignals += 1;
    motivos.push("nieve pronosticada");
  }

  if (severeStorm.includes(weathercode)) {
    score += 24;
    strongSignals += 1;
    motivos.push("tormenta pronosticada");
  }

  if (viento >= 90) {
    score += 30;
    strongSignals += 1;
    motivos.push("viento extremo");
  } else if (viento >= 70) {
    score += 20;
    motivos.push("viento fuerte");
  } else if (viento >= 50) {
    score += 10;
    motivos.push("viento moderado");
  }

  if (severeRain.includes(weathercode) || precip >= 12) {
    score += 16;
    motivos.push("precipitacion alta");
  } else if (precip >= 5) {
    score += 8;
    motivos.push("precipitacion moderada");
  }

  if (tempMin <= -8) {
    score += 14;
    motivos.push("temperatura minima critica");
  } else if (tempMin <= 0) {
    score += 7;
    motivos.push("temperatura bajo cero");
  }

  if (Number(paso.altitud || 0) >= 2500) {
    score += 8;
    motivos.push("alta montaña");
  }

  if (ultimoEstado === "cerrado") {
    score += 14;
    motivos.push("ultimo estado cerrado");
  } else if (ultimoEstado === "precaucion") {
    score += 8;
    motivos.push("ultimo estado con precaucion");
  }

  if (cierres7d >= 3) {
    score += 14;
    motivos.push("cierres frecuentes recientes");
  } else if (cierres7d >= 1) {
    score += 7;
    motivos.push("cierres recientes");
  }

  if (prec7d >= 2) {
    score += 7;
    motivos.push("precauciones recientes");
  }

  if (alertaVigente) {
    score += 10;
    motivos.push("alerta vigente");
  }

  score = clamp(score * item.weight, 0, 100);
  const prob = clamp(score / 100, 0.05, 0.95);

  const estado_predicho = predictedState(prob, score, strongSignals);

  out.push({
    json: {
      paso_id: paso.paso_id,
      paso_documentId: paso.paso_documentId,
      nombre_oficial: paso.nombre_oficial,
      horizonte_horas: item.h,
      probabilidad: Number(prob.toFixed(2)),
      nivel_riesgo: riskLabel(prob),
      estado_predicho,
      confianza: prob >= 0.7 ? "alta" : prob >= 0.45 ? "media" : "baja",
      motivo_resumen:
        motivos.slice(0, 5).join(", ") || "sin señales relevantes",
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
