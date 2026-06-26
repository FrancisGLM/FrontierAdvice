export type EstadoPaso = 'abierto' | 'precaucion' | 'cerrado';
export type NivelRiesgo = 'bajo' | 'medio' | 'alto';
export type IconoClima = 'sol' | 'nublado' | 'lluvia' | 'lluvia_intensa' | 'nieve' | 'tormenta';
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

export interface SenalPredictiva {
  nivelRiesgo: 'Alto' | 'Medio' | 'Bajo';
  horizonteHoras: number;
  motivoResumen: string;
  tipoEvento: string;
  fechaCalculo: string;
}

export interface PronosticoDia {
  dia: string;
  icono: IconoClima;
  riesgo: NivelRiesgo;
  alerta?: string;
}

export interface EstadoDiario {
  id: number | string;
  documentId: string;
  fecha_reporte: string;
  estado_general: string;
  fuente: string;
  mensaje_original: string;
  horario_apertura: string | null;
  horario_cierre: string | null;
  tipo_vehiculos: string[] | null;
  motivo_estado: string | null;
}

export interface PasoFronterizo {
  id: string;
  documentId?: string;
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
  senalPredictivas?: SenalPredictiva[];
  estado_diarios?: EstadoDiario;
}

export interface FiltrosMapa {
  estado: 'todos' | 'abiertos';
  region: string;
  busqueda: string;
}
