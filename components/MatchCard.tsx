'use client';
import { useApp } from '@/context/AppContext';
import { calcularPuntos } from '@/lib/scoring';
import { flag, FASE_NOMBRE, partidoCerrado, inicioPartido } from '@/lib/matches';
import LiveStats from '@/components/LiveStats';
import type { Match } from '@/lib/types';

export default function MatchCard({ m }: { m: Match }) {
  const { esAdmin, predicciones, resultados, guardados, dispatch } = useApp();
  const esKnock = m.fase !== 'grupo';
  const faseLabel = esKnock ? FASE_NOMBRE[m.fase] : ('Grupo ' + m.grupo);
  const real = resultados[m.id] || { l: null, v: null };
  const pred = predicciones[m.id] || { l: null, v: null };
  const tieneR = real.l !== null && real.v !== null;
  const cerrado = partidoCerrado(m);
  const ini = inicioPartido(m);
  const ahora = Date.now();
  const enVivo = ini !== null && ahora >= ini.getTime() && ahora < ini.getTime() + 120 * 60 * 1000;
  const bloqueado = guardados.includes(m.id);
  const editable = esAdmin ? true : (!tieneR && !cerrado && !bloqueado);
  const lv = esAdmin ? (real.l ?? '') : (pred.l ?? '');
  const vv = esAdmin ? (real.v ?? '') : (pred.v ?? '');

  let resultLine: React.ReactNode = null;
  if (tieneR && !esAdmin) {
    const pts = calcularPuntos(pred, real, m.fase);
    if (pred.l !== null) {
      const color = enVivo ? '#e53935' : pts === 0 ? '#cfd8d2' : pts === 25 ? '#1A6B2F' : '#27AE60';
      const etiqueta = enVivo ? '🔴 En juego…' : pts === 0 ? 'Fallaste' : pts === 25 ? 'Marcador exacto +25' : 'Acertaste ganador +15';
      resultLine = (
        <div style={{ textAlign: 'center', fontSize: '.74rem', marginTop: 8, fontWeight: 600, padding: 4, borderRadius: 7, background: color, color: '#fff' }}>
          {!enVivo && <>Real: {real.l}-{real.v} · </>}Tú: {pred.l}-{pred.v} · <b>{etiqueta}</b>
        </div>
      );
    } else {
      resultLine = (
        <div style={{ textAlign: 'center', fontSize: '.74rem', marginTop: 8, fontWeight: 600, padding: 4, borderRadius: 7, background: '#cfd8d2', color: '#fff' }}>
          Real: {real.l}-{real.v} · No apostaste
        </div>
      );
    }
  } else if (tieneR && esAdmin) {
    resultLine = (
      <div style={{ textAlign: 'center', fontSize: '.74rem', marginTop: 8, fontWeight: 600, padding: 4, borderRadius: 7, background: '#EDF7EE', color: '#1A6B2F' }}>
        Guardado: {real.l}-{real.v}
      </div>
    );
  } else if (!editable && !esAdmin) {
    if (bloqueado && pred.l !== null) {
      resultLine = <div style={{ textAlign: 'center', fontSize: '.7rem', color: '#1A6B2F', marginTop: 6, fontWeight: 600 }}>🔒 Apuesta guardada: {pred.l}-{pred.v} · sin cambios</div>;
    } else if (cerrado && pred.l !== null) {
      resultLine = <div style={{ textAlign: 'center', fontSize: '.7rem', color: '#5a6b5e', marginTop: 6 }}>🔒 Cerrado · tu apuesta: {pred.l}-{pred.v}</div>;
    } else {
      resultLine = <div style={{ textAlign: 'center', fontSize: '.7rem', color: '#5a6b5e', marginTop: 6 }}>🔒 Cerrado · cierra 5 min antes del partido</div>;
    }
  }

  function handleChange(side: 'l' | 'v', raw: string) {
    const v = raw.replace(/[^0-9]/g, '').slice(0, 2);
    const num = v === '' ? null : parseInt(v);
    dispatch({ type: 'UPDATE_SCORE', store: esAdmin ? 'resultados' : 'predicciones', mid: m.id, side, val: num });
  }

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
      {/* Header: fase + hora / EN VIVO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.7rem', color: '#5a6b5e', marginBottom: 8, fontWeight: 600 }}>
        <span style={{ background: esKnock ? '#fdf3dd' : '#EDF7EE', color: esKnock ? '#9a7400' : '#1A6B2F', padding: '2px 8px', borderRadius: 6 }}>{faseLabel}</span>
        {enVivo
          ? <span style={{ background: '#e53935', color: '#fff', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>🔴 EN VIVO</span>
          : <span>{m.dia} · {m.hora} 🇨🇴</span>
        }
      </div>

      {/* Marcador real encima de los inputs (informativo) */}
      {tieneR && !esAdmin && (
        <div style={{ textAlign: 'center', fontSize: '.82rem', fontWeight: 900, letterSpacing: '.04em', marginBottom: 6, color: enVivo ? '#e53935' : '#1A6B2F' }}>
          {enVivo ? '🔴 ' : '⚽ '}{real.l} — {real.v}
        </div>
      )}

      {/* Equipos + inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 600, fontSize: '.92rem' }}>
          <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{flag(m.local)}</span>
          <span>{m.local}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input className="score-in" inputMode="numeric" maxLength={2} value={String(lv)} disabled={!editable} onChange={e => handleChange('l', e.target.value)} />
          <span style={{ fontSize: '.7rem', color: '#5a6b5e', fontWeight: 700 }}>VS</span>
          <input className="score-in" inputMode="numeric" maxLength={2} value={String(vv)} disabled={!editable} onChange={e => handleChange('v', e.target.value)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', gap: 7, fontWeight: 600, fontSize: '.92rem', textAlign: 'right' }}>
          <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{flag(m.visitante)}</span>
          <span>{m.visitante}</span>
        </div>
      </div>

      {resultLine}

      {/* Estadísticas colapsables (cuando hay resultado o está en vivo) */}
      {(tieneR || enVivo) && !esAdmin && <LiveStats m={m} enVivo={enVivo} />}
    </div>
  );
}
