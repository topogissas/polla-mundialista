import type { Score } from './types';

export function calcularPuntos(pred: Score, real: Score, fase: string): number | null {
  if (real.l === null || real.v === null || pred.l === null || pred.v === null) return null;
  const mult = fase === 'grupo' ? 1 : 2;
  if (pred.l === real.l && pred.v === real.v) return 5 * mult;
  const pd = pred.l - pred.v;
  const rd = real.l - real.v;
  if (Math.sign(pd) === Math.sign(rd) && pd === rd) return 3 * mult;
  if (Math.sign(pd) === Math.sign(rd)) return 1 * mult;
  return 0;
}
