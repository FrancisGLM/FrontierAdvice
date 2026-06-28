/**
 * ================================================================================
 *  FASE 3: SCORING MULTICRITERIO (Motor de Decision)
 * ================================================================================
 *  Este script se coloca DESPUES del nodo HTTP de Matrix.
 *  Cruza los datos del prefiltro con la matriz de distancias reales,
 *  calcula el score final ponderado y emite el ganador.
 */

const item = $input.all()[0].json;

if (item.status === "sin_pasos") {
    return [{ json: item }]; // Pasa directo el fallback
}

// Obtener la matriz del nodo actual (Fase 2)
let mat = $input.all()[0].json;
if (mat.body && mat.body.distances) {
    mat = mat.body; // Si usamos Full Response
} else if (mat.ors_matrix_response) {
    mat = mat.ors_matrix_response.body || mat.ors_matrix_response;
}

// OBTENER LA DATA DEL NODO FASE 1
let fase1;
try {
    fase1 = $("Fase 1").first().json;
} catch (e) {
    throw new Error("Por favor, renombra tu primer nodo Code a 'Fase 1' para que este script pueda leer sus datos.");
}

// OBTENER DATOS DE VEHÍCULO DEL NODO COMPACT
let compactNode;
try {
    compactNode = $("Compact").first().json;
} catch (e) {
    throw new Error("No se pudo leer el nodo 'Compact'. Verifica el nombre.");
}
const vehiculo_real = compactNode.vehiculo || "";
const subtipo_real = compactNode.subtipo_camion || "";

const config = fase1.config;
const topCandidatos = fase1.top_candidatos;

if (!mat || !mat.distances) throw new Error("No se recibio respuesta valida de ORS Matrix");

// Extraemos la distancia directa Vial (A -> C) para normalizar.
// En nuestra matriz: A es index 0 en sources. C es el ultimo index en destinations.
const idxAC_source = 0;
const idxAC_dest = topCandidatos.length; 
const dAC_vial_km = mat.distances[idxAC_source][idxAC_dest];
const tAC_vial_s  = mat.durations[idxAC_source][idxAC_dest];

function calcIDR(dAB, dBC, dAC) { return (dAC > 0) ? (dAB + dBC) / dAC : Infinity; }

const candidatosEvaluados = topCandidatos.map((paso, i) => {
    // A -> B[i]: Source index 0, Dest index i
    const dAB_km = mat.distances[0][i];
    const tAB_s  = mat.durations[0][i];
    
    // B[i] -> C: Source index i+1, Dest index idxAC_dest
    const dBC_km = mat.distances[i + 1][idxAC_dest];
    const tBC_s  = mat.durations[i + 1][idxAC_dest];
    
    const totalKm = dAB_km + dBC_km;
    const totalS  = tAB_s  + tBC_s;
    const IDR_vial = calcIDR(dAB_km, dBC_km, dAC_vial_km);

    // Funcion de costo base
    const ref = dAC_vial_km > 0 ? dAC_vial_km : 1;
    const tRef = tAC_vial_s  > 0 ? tAC_vial_s  : 1;
    const scoreBase = config.WEIGHTS.wDist * (totalKm / ref)
                    + config.WEIGHTS.wIDR  * IDR_vial
                    + config.WEIGHTS.wTime * (totalS  / tRef);

    const penalizacion = config.ESTADO_PENALTY[paso.estado_operativo] ?? 1.0;
    const scoreFinal = scoreBase * penalizacion;

    return {
        ...paso,
        distancia_origen_km:  Math.round(dAB_km * 10) / 10,
        distancia_destino_km: Math.round(dBC_km * 10) / 10,
        total_vial_km:        Math.round(totalKm * 10) / 10,
        tiempo_origen_min:    Math.round(tAB_s / 60),
        tiempo_destino_min:   Math.round(tBC_s / 60),
        total_tiempo_min:     Math.round(totalS / 60),
        IDR_vial:             Math.round(IDR_vial * 10000) / 10000,
        penalizacion_estado:  penalizacion,
        score:                Math.round(scoreFinal * 10000) / 10000,
    };
});

candidatosEvaluados.sort((a, b) => a.score - b.score);
const optimo = candidatosEvaluados[0];
const alternativo = candidatosEvaluados.length > 1 ? candidatosEvaluados[1] : null;

const gHaversine = fase1.ganador_haversine;
const gVincenty = fase1.ganador_vincenty;
const coinciden = gHaversine.nombre === gVincenty.nombre && gVincenty.nombre === optimo.nombre;

return [{
    json: {
        vehiculo: vehiculo_real,
        subtipo_camion: subtipo_real,
        metadata: {
            motor: "FrontierAdvice Decision Engine v2.0 (Split Arch)",
            perfil_ors: config.profile,
            tipo_vehiculo: config.tipoVehiculo,
            distancia_directa_vial_km: Math.round(dAC_vial_km * 10) / 10,
        },
        paso_seleccionado: {
            documentId:           optimo.documentId,
            nombre:               optimo.nombre,
            estado_operativo:     optimo.estado_operativo,
            total_vial_km:        optimo.total_vial_km,
            total_tiempo_min:     optimo.total_tiempo_min,
            IDR_vial:             optimo.IDR_vial,
            score:                optimo.score,
        },
        top3_alternativas: candidatosEvaluados.slice(0, 3).map(p => ({
            nombre:             p.nombre,
            estado_operativo:   p.estado_operativo,
            total_vial_km:      p.total_vial_km,
            total_tiempo_min:   p.total_tiempo_min,
            score:              p.score,
        })),
        comparativa_metodos: {
            haversine_seleccionaria:      gHaversine.nombre,
            vincenty_puro_seleccionaria:  gVincenty.nombre,
            motor_decision_selecciono:    optimo.nombre,
            los_tres_coinciden:           coinciden,
            diferencia_km_haversine_vs_motor: isFinite(gHaversine.km)
                ? Math.round((optimo.total_vial_km - gHaversine.km) * 10) / 10
                : null
        },
        // Waypoints listos para el nodo ORS Directions Final (Branch B)
        ors_waypoints: [
            [config.oLon, config.oLat],
            [optimo._bLon, optimo._bLat],
            [config.dLon, config.dLat]
        ],
        ors_alternative_waypoints: alternativo ? [
            [config.oLon, config.oLat],
            [alternativo._bLon, alternativo._bLat],
            [config.dLon, config.dLat]
        ] : null
    }
}];
