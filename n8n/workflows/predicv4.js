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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function riskLabel(prob) {
  if (prob >= 0.66) return "Alto";
  if (prob >= 0.36) return "Medio";
  return "Bajo";
}

function predictedState(prob, hardSignals = 0) {
  if (prob >= 0.78 || hardSignals >= 2) return "cerrado";
  if (prob >= 0.42) return "precaucion";
  return "abierto";
}

function addScore(bucket, points, motivo, maxBucket, motivos) {
  bucket.value = clamp(bucket.value + points, 0, maxBucket);
  motivos.push(motivo);
}

const hist = estados
  .map((e) => ({
    estado: normEstado(e),
    fecha: new Date(e.fecha_reporte).getTime(),
  }))
  .filter((x) => Number.isFinite(x.fecha))
  .sort((a, b) => b.fecha - a.fecha);

const now = Date.now();
const hace7Dias = now - 7 * 24 * 60 * 60 * 1000;
const reportes7d = hist.filter((x) => x.fecha >= hace7Dias);

const alertaVigente = Array.isArray(alertas) && alertas.length > 0;
const ultimoEstado = hist[0]?.estado || "desconocido";

const cierres7d = reportes7d.filter((x) => x.estado === "cerrado").length;
const prec7d = reportes7d.filter((x) => x.estado === "precaucion").length;

const recencyScore = reportes7d.reduce((acc, x) => {
  const ageHours = (now - x.fecha) / 36e5;
  if (x.estado === "cerrado") {
    if (ageHours <= 24) return acc + 12;
    if (ageHours <= 72) return acc + 8;
    return acc + 4;
  }
  if (x.estado === "precaucion") {
    if (ageHours <= 24) return acc + 6;
    if (ageHours <= 72) return acc + 4;
    return acc + 2;
  }
  return acc;
}, 0);

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

  const motivos = [];
  const severe = { value: 0 };
  const freeze = { value: 0 };
  const wind = { value: 0 };
  const history = { value: 0 };
  const alerts = { value: 0 };

  if ([66, 67].includes(weathercode)) {
    addScore(freeze, 28, "lluvia engelante", 28, motivos);
  }
  if ([71, 73, 75, 77, 85, 86].includes(weathercode)) {
    addScore(severe, 26, "nieve pronosticada", 30, motivos);
  }
  if ([95, 96, 97, 99].includes(weathercode)) {
    addScore(severe, 24, "tormenta pronosticada", 30, motivos);
  }
  if ([63, 65].includes(weathercode)) {
    addScore(severe, 14, "lluvia intensa", 20, motivos);
  } else if (precip >= 10) {
    addScore(severe, 12, "precipitacion alta", 20, motivos);
  } else if (precip >= 4) {
    addScore(severe, 7, "precipitacion moderada", 15, motivos);
  }

  if (viento >= 80) {
    addScore(wind, 24, "viento extremo", 24, motivos);
  } else if (viento >= 60) {
    addScore(wind, 16, "viento fuerte", 20, motivos);
  } else if (viento >= 40) {
    addScore(wind, 8, "viento moderado", 12, motivos);
  }

  if (tempMin <= -5) {
    addScore(freeze, 10, "temperatura minima muy baja", 16, motivos);
  } else if (tempMin <= 0) {
    addScore(freeze, 6, "temperatura bajo cero", 10, motivos);
  }

  if (Number(paso.altitud || 0) >= 2500) {
    addScore(freeze, 6, "paso de alta montana", 12, motivos);
  }

  if (ultimoEstado === "cerrado") {
    addScore(history, 14, "ultimo estado cerrado", 20, motivos);
  } else if (ultimoEstado === "precaucion") {
    addScore(history, 8, "ultimo estado con precaucion", 12, motivos);
  }

  if (cierres7d >= 3) {
    addScore(history, 14, "cierres frecuentes en 7 dias", 20, motivos);
  } else if (cierres7d >= 1) {
    addScore(history, 7, "cierres recientes", 12, motivos);
  }

  if (prec7d >= 2) {
    addScore(history, 6, "antecedentes de precaucion", 10, motivos);
  }

  if (recencyScore > 0) {
    addScore(history, recencyScore, "recencia operativa", 24, motivos);
  }

  if (alertaVigente) {
    addScore(alerts, 12, "alerta vigente reportada", 12, motivos);
  }

  const totalScore = clamp(
    severe.value + freeze.value + wind.value + history.value + alerts.value,
    0,
    100,
  );

  const hardSignals =
    ([66, 67, 71, 73, 75, 77, 85, 86, 95, 96, 97, 99].includes(weathercode)
      ? 1
      : 0) +
    (viento >= 80 ? 1 : 0) +
    (alertaVigente ? 1 : 0) +
    (ultimoEstado === "cerrado" ? 1 : 0);

  const prob = clamp(totalScore / 100, 0.05, 0.95);

  out.push({
    json: {
      paso_id: paso.paso_id,
      paso_documentId: paso.paso_documentId,
      nombre_oficial: paso.nombre_oficial,
      horizonte_horas: item.h,
      probabilidad: Number(prob.toFixed(2)),
      nivel_riesgo: riskLabel(prob),
      estado_predicho: predictedState(prob, hardSignals),
      motivo_resumen:
        motivos.slice(0, 5).join(", ") || "sin señales relevantes",
      fecha_calculo: new Date().toISOString(),
      valido_desde: new Date().toISOString(),
      valido_hasta: new Date(
        Date.now() + item.h * 60 * 60 * 1000,
      ).toISOString(),
      modelo_version: "risk-v3-buckets",
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
