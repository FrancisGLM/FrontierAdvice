export type EstadoPaso = 'abierto' | 'precaucion' | 'cerrado';
export type NivelRiesgo = 'bajo' | 'medio' | 'alto';
export type IconoClima = 'sol' | 'nublado' | 'lluvia' | 'nieve' | 'tormenta';
export type Region =
  | 'Arica y Parinacota'
  | 'Tarapacá'
  | 'Antofagasta'
  | 'Atacama'
  | 'Coquimbo'
  | 'Valparaíso'
  | 'Metropolitana'
  | 'O\'Higgins'
  | 'Maule'
  | 'Biobío'
  | 'La Araucanía'
  | 'Los Ríos'
  | 'Los Lagos'
  | 'Aysén'
  | 'Magallanes';

export interface ClimaActual {
  temperatura: number;
  sensacionTermica: number;
  descripcion: string;
  icono: IconoClima;
  viento: number; // km/h
  humedad: number; // %
  visibilidad: number; // km
  presion: number; // hPa
}

export interface PronosticoDia {
  dia: string;
  icono: IconoClima;
  riesgo: NivelRiesgo;
  alerta?: string;
}

export interface PasoFronterizo {
  id: string;
  nombre: string;
  subtitulo?: string;
  lat: number;
  lng: number;
  estado: EstadoPaso;
  region: Region;
  ultimaActualizacion: string;
  altitud?: number;
  pronostico: PronosticoDia[];
  climaActual?: ClimaActual;
}

export interface FiltrosMapa {
  estado: 'todos' | 'abiertos';
  region: string;
  busqueda: string;
}

// ── OpenRouteService ────────────────────────────────────────────────────────

export interface OrsSegmentStep {
  distance: number;      // metres
  duration: number;      // seconds
  type: number;          // maneuver type code
  instruction: string;
  name: string;
  way_points: [number, number];
  exit_number?: number;
}

export interface OrsSegment {
  distance: number;
  duration: number;
  steps: OrsSegmentStep[];
}

export interface OrsRouteSummary {
  distance: number;      // metres
  duration: number;      // seconds
}

export interface OrsFeatureProperties {
  segments: OrsSegment[];
  way_points: [number, number];
  summary: OrsRouteSummary;
}

export interface OrsFeature {
  type: 'Feature';
  bbox: [number, number, number, number];
  properties: OrsFeatureProperties;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];  // [lng, lat] pairs (GeoJSON standard)
  };
}

export interface OrsResponse {
  type: 'FeatureCollection';
  bbox: [number, number, number, number];
  features: OrsFeature[];
  metadata: {
    attribution: string;
    service: string;
    timestamp: number;
    query: {
      coordinates: [number, number][];
      profile: string;
      profileName: string;
      format: string;
    };
    engine: {
      version: string;
      build_date: string;
      graph_date: string;
      osm_date: string;
    };
  };
}

// ── Respuesta nueva de n8n: array [mensaje, rutaPrimaria, rutaAlternativa] ───
// response[0] = { mensaje_natural, paso_primario?, paso_alternativo? }
// response[1] = OrsResponse (ruta primaria)
// response[2] = OrsResponse (ruta alternativa)

export interface N8nMensaje {
  mensaje_natural: string;
  paso_primario?: string;
  paso_alternativo?: string;
}

export interface N8nDobleRutaResponse {
  mensaje: N8nMensaje;
  rutaPrimaria: OrsResponse;
  rutaAlternativa: OrsResponse;
}
