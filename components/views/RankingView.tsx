'use client';
import { useEffect, useState, useCallback } from 'react';
import { sb } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { ALL_MATCHES } from '@/lib/matches';
import { calcularPuntos } from '@/lib/scoring';
import type { RankingEntry, Resultados } from '@/lib/types';

export default function RankingView({ toast }: { toast: (m: string) => void }) {
  const { esAdmin } = useApp();
  const [tabla, setTabla] = useState<RankingEntry[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RankingEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const cargar = useCallback(async () => {
    const { data: resData } = await sb.from('polla_resultados').select('*');
    const resultados: Resultados = {};
    (resData || []).forEach((r: any) => { resultados[r.match_id] = { l: r.goles_local, v: r.goles_visitante }; });

    const { data: parts } = await sb.from('polla_participantes').select('id,nombre');
    if (!parts?.length) { setTabla([]); return; }

    const { data: allPron } = await sb.from('polla_pronosticos').select('*');
    const porPart: Record<string, Record<string, { l: number; v: number }>> = {};
    (allPron || []).forEach((p: any) => {
      porPart[p.participante_id] = porPart[p.participante_id] || {};
      porPart[p.participante_id][p.match_id] = { l: p.goles_local, v: p.goles_visitante };
    });

    const t: RankingEntry[] = parts.map((p: any) => {
      let total = 0, exactos = 0, jugados = 0;
      const preds = porPart[p.id] || {};
      ALL_MATCHES.forEach(m => {
        const real = resultados[m.id];
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
    setDeleting(true);
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
      setDeleting(false);
      setConfirmDelete(null);
    }
  }

  if (!tabla) return <div style={{ textAlign: 'center', padding: 30, color: '#5a6b5e' }}>Calculando ranking…</div>;
  if (!tabla.length) return <div style={{ textAlign: 'center', padding: '40px 20px', color: '#5a6b5e' }}>Aún no hay participantes. ¡Invita a tus amigos!</div>;

  return (
    <div style={{ paddingTop: 12 }}>
      {tabla.map((r, i) => {
        const med = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1);
        return (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 12, padding: '11px 14px', marginBottom: 8, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', width: 30, textAlign: 'center', color: i === 0 ? '#D4A017' : '#5a6b5e' }}>{med}</div>
            <div style={{ flex: 1, fontWeight: 600 }}>
              {r.nombre}
              <small style={{ display: 'block', fontWeight: 400, color: '#5a6b5e', fontSize: '.72rem' }}>{r.exactos} exactos · {r.jugados} jugados</small>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#1A6B2F', textAlign: 'right' }}>
              {r.total}
              <span style={{ fontSize: '.68rem', fontWeight: 600, color: '#5a6b5e', display: 'block' }}>puntos</span>
            </div>
            {esAdmin && (
              <button
                onClick={() => setConfirmDelete(r)}
                style={{ background: '#fff0f0', border: '1px solid #f5a5a5', color: '#c0392b', borderRadius: 8, padding: '5px 10px', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >🗑 Borrar</button>
            )}
          </div>
        );
      })}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 200 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 340, width: '100%' }}>
            <h2 style={{ fontSize: '1.1rem', color: '#c0392b', marginBottom: 8 }}>¿Borrar usuario?</h2>
            <p style={{ fontSize: '.88rem', color: '#5a6b5e', marginBottom: 18 }}>
              Se eliminará a <b>{confirmDelete.nombre}</b> junto con todos sus pronósticos y especiales. Esta acción no se puede deshacer.
            </p>
            <button
              onClick={() => borrarParticipante(confirmDelete)}
              disabled={deleting}
              style={{ display: 'block', width: '100%', padding: 13, background: '#c0392b', color: '#fff', border: 0, borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', marginBottom: 8, opacity: deleting ? .6 : 1 }}
            >{deleting ? 'Borrando…' : 'Sí, borrar'}</button>
            <button
              onClick={() => setConfirmDelete(null)}
              disabled={deleting}
              style={{ display: 'block', width: '100%', padding: 13, background: '#fff', color: '#1A6B2F', border: '1px solid #27AE60', borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: 'pointer' }}
            >Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
