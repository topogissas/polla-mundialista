'use client';
import { useApp } from '@/context/AppContext';
import { calcularPuntos } from '@/lib/scoring';
import { flag, FASE_NOMBRE, partidoCerrado } from '@/lib/matches';
import type { Match } from '@/lib/types';

export default function MatchCard({ m }: { m: Match }) {
  const { esAdmin, predicciones, resultados, dispatch } = useApp();
  const esKnock = m.fase !== 'grupo';
  const faseLabel = esKnock ? FASE_NOMBRE[m.fase] : ('Grupo ' + m.grupo);
  const real = resultados[m.id] || { l: null, v: null };
  const pred = predicciones[m.id] || { l: null, v: null };
  const tieneR = real.l !== null && real.v !== null;
  const cerrado = partidoCerrado(m);
  const editable = esAdmin ? true : (!tieneR && !cerrado);
  const lv = esAdmin ? (real.l ?? '') : (pred.l ?? '');
  const vv = esAdmin ? (real.v ?? '') : (pred.v ?? '');

  let resultLine: React.ReactNode = null;
  if (tieneR && !esAdmin) {
    const pts = calcularPuntos(pred, real, m.fase);
    const mult = m.fase === 'grupo' ? 1 : 2;
    if (pred.l !== null) {
      const color = pts === 0 ? '#cfd8d2' : pts! >= 5 * mult ? '#1A6B2F' : pts! >= 3 * mult ? '#27AE60' : '#9CCC65';
      resultLine = <div style={{ textAlign: 'center', fontSize: '.74rem', marginTop: 8, fontWeight: 600, padding: 4, borderRadius: 7, background: color, color: '#fff' }}>
        Real: {real.l}-{real.v} · Tú: {pred.l}-{pred.v} · <b>{pts === 0 ? 'Fallaste' : '+' + pts + ' pts'}</b>
      </div>;
    } else {
      resultLine = <div style={{ textAlign: 'center', fontSize: '.74rem', marginTop: 8, fontWeight: 600, padding: 4, borderRadius: 7, background: '#cfd8d2', color: '#fff' }}>
        Real: {real.l}-{real.v} · No pronosticaste
      </div>;
    }
  } else if (tieneR && esAdmin) {
    resultLine = <div style={{ textAlign: 'center', fontSize: '.74rem', marginTop: 8, fontWeight: 600, padding: 4, borderRadius: 7, background: '#EDF7EE', color: '#1A6B2F' }}>
      Guardado: {real.l}-{real.v}
    </div>;
  } else if (!editable && !esAdmin) {
    resultLine = cerrado && pred.l !== null
      ? <div style={{ textAlign: 'center', fontSize: '.7rem', color: '#5a6b5e', marginTop: 6 }}>🔒 Cerrado · tu pronóstico: {pred.l}-{pred.v}</div>
      : <div style={{ textAlign: 'center', fontSize: '.7rem', color: '#5a6b5e', marginTop: 6 }}>🔒 {cerrado ? 'Cerrado · el partido ya empezó' : 'Cerrado'}</div>;
  }

  function handleChange(side: 'l' | 'v', raw: string) {
    const v = raw.replace(/[^0-9]/g, '').slice(0, 2);
    const num = v === '' ? null : parseInt(v);
    dispatch({ type: 'UPDATE_SCORE', store: esAdmin ? 'resultados' : 'predicciones', mid: m.id, side, val: num });
  }

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.7rem', color: '#5a6b5e', marginBottom: 8, fontWeight: 600 }}>
        <span style={{ background: esKnock ? '#fdf3dd' : '#EDF7EE', color: esKnock ? '#9a7400' : '#1A6B2F', padding: '2px 8px', borderRadius: 6 }}>{faseLabel}</span>
        <span>{m.dia} · {m.hora} 🇨🇴</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 600, fontSize: '.92rem' }}>
          <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{flag(m.local)}</span>
          <span>{m.local}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            className="score-in"
            inputMode="numeric"
            maxLength={2}
            defaultValue={String(lv)}
            disabled={!editable}
            onChange={e => handleChange('l', e.target.value)}
          />
          <span style={{ fontSize: '.7rem', color: '#5a6b5e', fontWeight: 700 }}>VS</span>
          <input
            className="score-in"
            inputMode="numeric"
            maxLength={2}
            defaultValue={String(vv)}
            disabled={!editable}
            onChange={e => handleChange('v', e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', gap: 7, fontWeight: 600, fontSize: '.92rem', textAlign: 'right' }}>
          <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{flag(m.visitante)}</span>
          <span>{m.visitante}</span>
        </div>
      </div>
      {resultLine}
    </div>
  );
}
