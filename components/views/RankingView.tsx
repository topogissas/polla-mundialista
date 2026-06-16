'use client';
import { useEffect, useState, useCallback } from 'react';
import { sb } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { ALL_MATCHES, flag, FASE_NOMBRE } from '@/lib/matches';
import { calcularPuntos } from '@/lib/scoring';
import type { RankingEntry, Resultados, Score } from '@/lib/types';

type PredsPorPart = Record<string, Record<string, Score>>;

export default function RankingView({ toast }: { toast: (m: string) => void }) {
  const { esAdmin } = useApp();
  const [tabla, setTabla] = useState<RankingEntry[] | null>(null);
  const [resultados, setResultados] = useState<Resultados>({});
  const [predsPorPart, setPredsPorPart] = useState<PredsPorPart>({});
  const [confirmDelete, setConfirmDelete] = useState<RankingEntry | null>(null);
  const [confirmReset, setConfirmReset] = useState<RankingEntry | null>(null);
  const [verApuestas, setVerApuestas] = useState<RankingEntry | null>(null);
  const [busy, setBusy] = useState(false);

  const cargar = useCallback(async () => {
    const { data: resData } = await sb.from('polla_resultados').select('*');
    const res: Resultados = {};
    (resData || []).forEach((r: any) => { res[r.match_id] = { l: r.goles_local, v: r.goles_visitante }; });
    setResultados(res);

    const { data: parts } = await sb.from('polla_participantes').select('id,nombre');
    if (!parts?.length) { setTabla([]); setPredsPorPart({}); return; }

    const { data: allPron } = await sb.from('polla_pronosticos').select('*');
    const porPart: PredsPorPart = {};
    (allPron || []).forEach((p: any) => {
      porPart[p.participante_id] = porPart[p.participante_id] || {};
      porPart[p.participante_id][p.match_id] = { l: p.goles_local, v: p.goles_visitante };
    });
    setPredsPorPart(porPart);

    const t: RankingEntry[] = parts.map((p: any) => {
      let total = 0, exactos = 0, jugados = 0;
      const preds = porPart[p.id] || {};
      ALL_MATCHES.forEach(m => {
        const real = res[m.id];
        const pr = preds[m.id];
        if (real?.l !== null && real?.l !== undefined && pr?.l !== null && pr?.l !== undefined) {
          const pts = calcularPuntos(pr, real, m.fase);
          if (pts !== null) {
            total += pts; jugados++;
            if (pts === 25) exactos++;
          }
        }
      });
      return { id: p.id, nombre: p.nombre, total, exactos, jugados };
    }).sort((a, b) => b.total - a.total || b.exactos - a.exactos);
    setTabla(t);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function borrarParticipante(entry: RankingEntry) {
    setBusy(true);
    try {
      await sb.from('polla_especiales').delete().eq('participante_id', entry.id);
      await sb.from('polla_pronosticos').delete().eq('participante_id', entry.id);
      // .select() devuelve las filas borradas: si RLS bloquea, llega [] sin error.
      const { data, error } = await sb.from('polla_participantes').delete().eq('id', entry.id).select();
      if (error) { toast('Error al borrar: ' + error.message); return; }
      if (!data || data.length === 0) {
        toast('⚠️ No se pudo borrar (sin permiso en la base de datos)');
        return;
      }
      toast(`✅ Usuario "${entry.nombre}" eliminado`);
      await cargar();
    } finally {
      setBusy(false);
      setConfirmDelete(null);
    }
  }

  async function resetearApuestas(entry: RankingEntry) {
    setBusy(true);
    try {
      const { data, error } = await sb.from('polla_pronosticos').delete().eq('participante_id', entry.id).select();
      if (error) { toast('Error: ' + error.message); return; }
      if (!data || data.length === 0) {
        toast('Ese usuario no tiene apuestas para borrar');
        return;
      }
      toast(`✅ Apuestas de "${entry.nombre}" borradas — puede volver a apostar`);
      await cargar();
    } finally {
      setBusy(false);
      setConfirmReset(null);
    }
  }

  if (!tabla) return <div style={{ textAlign: 'center', padding: 30, color: '#5a6b5e' }}>Calculando ranking…</div>;
  if (!tabla.length) return <div style={{ textAlign: 'center', padding: '40px 20px', color: '#5a6b5e' }}>Aún no hay participantes. ¡Invita a tus amigos!</div>;

  const preds = verApuestas ? (predsPorPart[verApuestas.id] || {}) : {};
  const apuestas = verApuestas ? ALL_MATCHES.filter(m => preds[m.id]?.l !== null && preds[m.id]?.l !== undefined) : [];

  return (
    <div style={{ paddingTop: 12 }}>
      {tabla.map((r, i) => {
        const med = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1);
        return (
          <div key={r.id} style={{ background: '#fff', borderRadius: 12, padding: '11px 14px', marginBottom: 8, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', width: 30, textAlign: 'center', color: i === 0 ? '#D4A017' : '#5a6b5e' }}>{med}</div>
              <div style={{ flex: 1, fontWeight: 600 }}>
                {r.nombre}
                <small style={{ display: 'block', fontWeight: 400, color: '#5a6b5e', fontSize: '.72rem' }}>{r.exactos} exactos · {r.jugados} jugados</small>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#1A6B2F', textAlign: 'right' }}>
                {r.total}
                <span style={{ fontSize: '.68rem', fontWeight: 600, color: '#5a6b5e', display: 'block' }}>puntos</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                onClick={() => setVerApuestas(r)}
                style={{ background: '#EDF7EE', border: '1px solid #cfe6d4', color: '#1A6B2F', borderRadius: 8, padding: '5px 10px', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer' }}
              >👁 Ver apuestas</button>
              {esAdmin && (
                <button
                  onClick={() => setConfirmReset(r)}
                  style={{ background: '#fff8e8', border: '1px solid #f0d68a', color: '#9a7400', borderRadius: 8, padding: '5px 10px', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer' }}
                >🔄 Resetear</button>
              )}
              {esAdmin && (
                <button
                  onClick={() => setConfirmDelete(r)}
                  style={{ background: '#fff0f0', border: '1px solid #f5a5a5', color: '#c0392b', borderRadius: 8, padding: '5px 10px', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer' }}
                >🗑 Borrar</button>
              )}
            </div>
          </div>
        );
      })}

      {/* Modal: ver apuestas de un participante */}
      {verApuestas && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}
          onClick={() => setVerApuestas(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#f4f8f5', borderRadius: '16px 16px 0 0', padding: 18, maxWidth: 600, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: '1.1rem', color: '#1A6B2F' }}>Apuestas de {verApuestas.nombre}</h2>
              <button onClick={() => setVerApuestas(null)} style={{ background: '#fff', border: '1px solid #dfe8e1', borderRadius: 8, padding: '4px 12px', fontSize: '.85rem', fontWeight: 700, cursor: 'pointer', color: '#5a6b5e' }}>Cerrar</button>
            </div>
            {!apuestas.length ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#5a6b5e', fontSize: '.88rem' }}>Aún no ha hecho ninguna apuesta.</div>
            ) : (
              apuestas.map(m => {
                const pr = preds[m.id];
                const real = resultados[m.id];
                const tieneR = real?.l !== null && real?.l !== undefined;
                const pts = tieneR ? calcularPuntos(pr, real, m.fase) : null;
                const faseLabel = m.fase === 'grupo' ? ('Grupo ' + m.grupo) : FASE_NOMBRE[m.fase];
                const color = pts === null ? '#5a6b5e' : pts === 0 ? '#c0392b' : pts === 25 ? '#1A6B2F' : '#27AE60';
                return (
                  <div key={m.id} style={{ background: '#fff', borderRadius: 10, padding: '8px 12px', marginBottom: 6, boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}>
                    <div style={{ fontSize: '.66rem', color: '#5a6b5e', fontWeight: 600, marginBottom: 3 }}>{faseLabel} · {m.dia}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '.85rem', fontWeight: 600 }}>
                      <span style={{ flex: 1 }}>{flag(m.local)} {m.local}</span>
                      <span style={{ background: '#EDF7EE', color: '#1A6B2F', borderRadius: 6, padding: '2px 8px', fontWeight: 800 }}>{pr.l}-{pr.v}</span>
                      <span style={{ flex: 1, textAlign: 'right' }}>{m.visitante} {flag(m.visitante)}</span>
                    </div>
                    {tieneR && (
                      <div style={{ fontSize: '.7rem', textAlign: 'center', marginTop: 4, color, fontWeight: 700 }}>
                        Real: {real.l}-{real.v} · {pts === 0 ? 'Falló' : pts === 25 ? '+25 (exacto)' : '+15 (ganador)'}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal: confirmar reset de apuestas */}
      {confirmReset && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 200 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 340, width: '100%' }}>
            <h2 style={{ fontSize: '1.1rem', color: '#9a7400', marginBottom: 8 }}>¿Resetear apuestas?</h2>
            <p style={{ fontSize: '.88rem', color: '#5a6b5e', marginBottom: 18 }}>
              Se borrarán <b>todas las apuestas</b> de <b>{confirmReset.nombre}</b> (no se borra el usuario). Podrá volver a apostar los partidos que sigan abiertos.
            </p>
            <button
              onClick={() => resetearApuestas(confirmReset)}
              disabled={busy}
              style={{ display: 'block', width: '100%', padding: 13, background: '#D4A017', color: '#fff', border: 0, borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', marginBottom: 8, opacity: busy ? .6 : 1 }}
            >{busy ? 'Borrando…' : 'Sí, resetear'}</button>
            <button
              onClick={() => setConfirmReset(null)}
              disabled={busy}
              style={{ display: 'block', width: '100%', padding: 13, background: '#fff', color: '#1A6B2F', border: '1px solid #27AE60', borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: 'pointer' }}
            >Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal: confirmar borrar usuario */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 200 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 340, width: '100%' }}>
            <h2 style={{ fontSize: '1.1rem', color: '#c0392b', marginBottom: 8 }}>¿Borrar usuario?</h2>
            <p style={{ fontSize: '.88rem', color: '#5a6b5e', marginBottom: 18 }}>
              Se eliminará a <b>{confirmDelete.nombre}</b> junto con todos sus pronósticos y especiales. Esta acción no se puede deshacer.
            </p>
            <button
              onClick={() => borrarParticipante(confirmDelete)}
              disabled={busy}
              style={{ display: 'block', width: '100%', padding: 13, background: '#c0392b', color: '#fff', border: 0, borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', marginBottom: 8, opacity: busy ? .6 : 1 }}
            >{busy ? 'Borrando…' : 'Sí, borrar'}</button>
            <button
              onClick={() => setConfirmDelete(null)}
              disabled={busy}
              style={{ display: 'block', width: '100%', padding: 13, background: '#fff', color: '#1A6B2F', border: '1px solid #27AE60', borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: 'pointer' }}
            >Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
