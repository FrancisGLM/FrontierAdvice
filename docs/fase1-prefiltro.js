/**
 * ================================================================================
 *  FASE 1: PRE-FILTRO GEODESICO (Motor de Decision)
 * ================================================================================
 *  Este script se coloca en un nodo Code ANTES del nodo HTTP de Matrix.
 *  Filtra pasos cerrados/incompatibles, calcula Vincenty, elige el Top 3,
 *  y genera el payload exacto para enviar a la API de Matrix en un solo request.
 */

const TOP_N = 3;
const IDR_MAX = 2.5;

// Variables y pesos (se pasan a la siguiente fase)
const WEIGHTS = { wDist: 0.50, wIDR: 0.30, wTime: 0.20 };
const ESTADO_PENALTY = {
    'abierto': 1.00, 'open': 1.00,
    'precaucion': 1.30, 'caution': 1.30,
    'cerrado': Infinity, 'closed': Infinity,
};
const VEHICULOS_PESADOS = new Set([
    'camion', 'camion_reparto', 'camion_agricola',
    'camion_mercancias', 'camion_forestal', 'bus', 'hgv'
]);

// ─── MATEMATICA GEODESICA ──────────────────────────────────────────────────────
function haversineKm(la1, lo1, la2, lo2) {
    const R = 6371; const r = d => d * Math.PI / 180;
    const a = Math.sin(r(la2-la1)/2)**2 + Math.cos(r(la1))*Math.cos(r(la2))*Math.sin(r(lo2-lo1)/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const _W = { a: 6378137.0, f: 1/298.257223563, b: 6356752.314245 };
function vincentyKm(la1, lo1, la2, lo2) {
    const { a, f, b } = _W; const R = d => d * Math.PI / 180;
    const phi1=R(la1), phi2=R(la2), L=R(lo2-lo1);
    const tU1=(1-f)*Math.tan(phi1), tU2=(1-f)*Math.tan(phi2);
    const cU1=1/Math.sqrt(1+tU1*tU1), sU1=tU1*cU1;
    const cU2=1/Math.sqrt(1+tU2*tU2), sU2=tU2*cU2;
    let lam=L, lP, sS, cS, sg, sA, c2A, c2Sm, C, it=0;
    do {
        const sL=Math.sin(lam), cL=Math.cos(lam);
        const ss=(cU2*sL)**2+(cU1*sU2-sU1*cU2*cL)**2;
        sS=Math.sqrt(ss); if(sS===0) return 0;
        cS=sU1*sU2+cU1*cU2*cL; sg=Math.atan2(sS,cS);
        sA=cU1*cU2*sL/sS; c2A=1-sA*sA;
        c2Sm=c2A!==0?cS-2*sU1*sU2/c2A:0;
        C=f/16*c2A*(4+f*(4-3*c2A)); lP=lam;
        lam=L+(1-C)*f*sA*(sg+C*sS*(c2Sm+C*cS*(-1+2*c2Sm**2)));
        if(++it>100) return haversineKm(la1,lo1,la2,lo2); // fallback
    } while(Math.abs(lam-lP)>1e-12);
    const u2=c2A*(a*a-b*b)/(b*b);
    const Av=1+u2/16384*(4096+u2*(-768+u2*(320-175*u2)));
    const Bv=u2/1024*(256+u2*(-128+u2*(74-47*u2)));
    const ds=Bv*sS*(c2Sm+Bv/4*(cS*(-1+2*c2Sm**2)-Bv/6*c2Sm*(-3+4*sS**2)*(-3+4*c2Sm**2)));
    return b*Av*(sg-ds)/1000;
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function calcIDR(dAB, dBC, dAC) { return (dAC > 0) ? (dAB + dBC) / dAC : Infinity; }
function estadoDePaso(p) { return (p.estado_general || p.estado || p.status || 'abierto').toLowerCase(); }
function esCompatible(p, tipoVehiculo) {
    if (!tipoVehiculo) return true;
    const habs = p.habilitado_para || p.habilitadoPara || p.allowed_for;
    if (!habs || !Array.isArray(habs) || habs.length === 0) return true;
    const tv = tipoVehiculo.toLowerCase();
    return habs.some(h => {
        const hl = (h || '').toLowerCase();
        return hl === tv || (tv.includes('camion') && hl.includes('camion')) || hl.includes('todo tipo');
    });
}

// ─── PROCESAMIENTO ─────────────────────────────────────────────────────────────
const item = $input.all()[0].json;
if (!item.origen || !item.destino) throw new Error("Faltan campos origen/destino.");

const oLat = parseFloat(item.origen.latitude ?? item.origen.latitud);
const oLon = parseFloat(item.origen.longitude ?? item.origen.longitud);
const dLat = parseFloat(item.destino.latitude ?? item.destino.latitud);
const dLon = parseFloat(item.destino.longitude ?? item.destino.longitud);
const tipoVehiculo = (item.tipo_vehiculo || item.vehiculo || '').toLowerCase();
const profile = VEHICULOS_PESADOS.has(tipoVehiculo) ? 'driving-hgv' : 'driving-car';

let pasos = item.pasos_fronterizos ?? item.data ?? [];

// 1. Filtrar estado y compatibilidad
const pasosFiltrados = pasos.filter(p => {
    if (ESTADO_PENALTY[estadoDePaso(p)] === Infinity) return false;
    if (!esCompatible(p, tipoVehiculo)) return false;
    return true;
});

if (!pasosFiltrados.length) {
    return [{ json: { status: "sin_pasos", mensaje: "No hay pasos viables." } }];
}

// 2. Calculo Geodesico
const dAC_geo = vincentyKm(oLat, oLon, dLat, dLon);
const evaluados = pasosFiltrados.map(p => {
    const bLat = parseFloat(p.latitud ?? p.lat);
    const bLon = parseFloat(p.longitud ?? p.lon ?? p.lng);
    const nombre = p.nombre_oficial ?? p.nombre ?? `ID-${p.id}`;
    if (isNaN(bLat) || isNaN(bLon)) return { ...p, nombre, IDR_geo: Infinity };

    const dAB = vincentyKm(oLat, oLon, bLat, bLon);
    const dBC = vincentyKm(bLat, bLon, dLat, dLon);
    const hAB = haversineKm(oLat, oLon, bLat, bLon);
    const hBC = haversineKm(bLat, bLon, dLat, dLon);

    return {
        ...p, nombre, _bLat: bLat, _bLon: bLon, estado_operativo: estadoDePaso(p),
        total_haversine_km: hAB + hBC,
        total_vincenty_km: dAB + dBC,
        IDR_geo: calcIDR(dAB, dBC, dAC_geo)
    };
});

evaluados.sort((a, b) => a.IDR_geo - b.IDR_geo);
const ganadorVincenty = evaluados[0];
const ganadorHaversine = [...evaluados].sort((a,b) => a.total_haversine_km - b.total_haversine_km)[0];

const topCandidatos = evaluados.filter(p => p.IDR_geo <= IDR_MAX).slice(0, TOP_N);
if (!topCandidatos.length) throw new Error("Ningun paso supera umbral IDR.");

// 3. Preparar payload de matriz para UN SOLO request HTTP
// Array [Origen, Cand1, Cand2, Cand3, Destino]
const locations = [
    [oLon, oLat],
    ...topCandidatos.map(p => [p._bLon, p._bLat]),
    [dLon, dLat]
];
const N = topCandidatos.length;
const sources = [0, ...topCandidatos.map((_, i) => i + 1)]; // A y todos los B
const destinations = [...topCandidatos.map((_, i) => i + 1), N + 1]; // Todos los B y C

return [{
    json: {
        status: "ok",
        metadata_prefiltro: { dAC_geo, total_pasos: pasos.length },
        config: { WEIGHTS, ESTADO_PENALTY, profile, tipoVehiculo, oLon, oLat, dLon, dLat },
        top_candidatos: topCandidatos,
        ganador_haversine: { nombre: ganadorHaversine.nombre, km: ganadorHaversine.total_haversine_km },
        ganador_vincenty: { nombre: ganadorVincenty.nombre, km: ganadorVincenty.total_vincenty_km },
        
        // ESTO LO LEE EL NODO HTTP DIRECTAMENTE
        ors_matrix_payload: {
            locations,
            sources,
            destinations,
            metrics: ["distance", "duration"],
            units: "km"
        }
    }
}];
