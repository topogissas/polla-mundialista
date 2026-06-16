export type Fase = 'grupo' | 'R32' | 'R16' | 'CF' | 'SF' | '3P' | 'FN';

export interface Match {
  id: string;
  fase: Fase | 'grupo';
  grupo: string | null;
  dia: string;
  hora: string;
  local: string;
  visitante: string;
  sede: string;
}

export interface Score {
  l: number | null;
  v: number | null;
}

export type Predicciones = Record<string, Score>;
export type Resultados = Record<string, Score>;

export interface Especiales {
  campeon: string | null;
  subcampeon: string | null;
  goleador: string | null;
}

export interface RankingEntry {
  id: string;
  nombre: string;
  total: number;
  exactos: number;
  jugados: number;
}

export type Vista = 'partidos' | 'ranking' | 'apuestas' | 'reglas' | 'avisos';
