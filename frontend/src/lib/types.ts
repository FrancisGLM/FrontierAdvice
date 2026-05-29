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
}

export interface FiltrosMapa {
  estado: 'todos' | 'abiertos';
  region: string;
  busqueda: string;
}
