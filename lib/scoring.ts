import type { Score } from './types';

// Puntaje plano para todas las fases:
//  - Marcador exacto      → 25 pts
//  - Acertar el resultado → 15 pts (mismo ganador, o empate acertado)
//  - Fallaste             → 0 pts
export const PTS_EXACTO = 25;
export const PTS_GANADOR = 15;

export function calcularPuntos(pred: Score, real: Score, _fase?: string): number | null {
  if (real.l === null || real.v === null || pred.l === null || pred.v === null) return null;
  if (pred.l === real.l && pred.v === real.v) return PTS_EXACTO;
  const po = Math.sign(pred.l - pred.v);
  const ro = Math.sign(real.l - real.v);
  if (po === ro) return PTS_GANADOR; // mismo resultado: ganador correcto o empate
  return 0;
}
