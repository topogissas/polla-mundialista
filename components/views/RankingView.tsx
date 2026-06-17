'use client';
import { useEffect, useState, useCallback } from 'react';
import { sb } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { ALL_MATCHES } from '@/lib/matches';
import { calcularPuntos } from '@/lib/scoring';
import type { RankingEntry, Resultados } from '@/lib/types';

export default function RankingView({ toast }: { toast: (m: string) => void }) {
  const { esAdmin, grupoId, grupoNombre } = useApp();
  const [tabla, setTabla] = useState<RankingEntry[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RankingEntry | null>(null);
  const [confirmReset, setConfirmReset] = useState<RankingEntry | null>(null);
  const [busy, setBusy] = useState(false);

  const cargar = useCallback(async () => {
    const { data: resData } = await sb.from('polla_resultados').select('*');
    const resultados: Resultados = {};
    (resData || []).forEach((r: any) => { resultados[r.match_id] = { l: r.goles_local, v: r.goles_visitante }; });

    // Get members of current group (or all if no group / admin without group)
    let memberIds: Set<string> | null = null;
    if (grupoId) {
      const { data: miembros } = await sb.from('grupo_miembros')
        .select('participante_id')
        .eq('grupo_id', grupoId)
        .eq('estado', 'activo');
      memberIds = new Set((miembros || []).map((m: any) => m.participante_id));
    }

    const { data: parts } = await sb.from('polla_participantes').select('id,nombre');
    const filteredParts = (parts || []).filter((p: any) => !memberIds || memberIds.has(p.id));
    if (!filteredParts.length) { setTabla([]); return; }

    // Filter pronosticos by grupo_id
    let pronQuery = sb.from('polla_pronosticos').select('*');
    if (grupoId) pronQuery = pronQuery.eq('grupo_id', grupoId);
    const { data: allPron } = await pronQuery;

    const porPart: Record<string, Record<string, { l: number; v: number }>> = {};
    (allPron || []).forEach((p: any) => {
      porPart[p.participante_id] = porPart[p.participante_id] || {};
      porPart[p.participante_id][p.match_id] = { l: p.goles_local, v: p.goles_visitante };
    });

    const t: RankingEntry[] = filteredParts.map((p: any) => {
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
  }, [grupoId]);

  useEffect(() => { cargar(); }, [cargar]);

  async function borrarParticipante(entry: RankingEntry) {
    setBusy(true);
    try {
      await sb.from('polla_especiales').delete().eq('participante_id', entry.id);
      await sb.from('polla_pronosticos').delete().eq('participante_id', entry.id);
      const { data, error } = await sb.from('polla_participantes').delete().eq('id', entry.id).select();
      if (error) { toast('Error al borrar: ' + error.message); return; }
      if (!data || data.length === 0) { toast('⚠️ No se pudo borrar (sin permiso en la base de datos)'); return; }
      toast(`✅ Usuario "${entry.nombre}" eliminado`);
      await cargar();
    } finally { setBusy(false); setConfirmDelete(null); }
  }

  async function resetearApuestas(entry: RankingEntry) {
    setBusy(true);
    try {
      let query = sb.from('polla_pronosticos').delete().eq('participante_id', entry.id);
      if (grupoId) query = (query as any).eq('grupo_id', grupoId);
      const { data, error } = await (query as any).select();
      if (error) { toast('Error: ' + error.message); return; }
      if (!data || data.length === 0) { toast('Ese usuario no tiene apuestas para borrar'); return; }
      toast(`✅ Apuestas de "${entry.nombre}" borradas — puede volver a apostar`);
      await cargar();
    } finally { setBusy(false); setConfirmReset(null); }
  }

  if (!tabla) return <div style={{ textAlign: 'center', padding: 30, color: '#474A4A' }}>Calculando ranking…</div>;
  if (!grupoId) return <div style={{ textAlign: 'center', padding: '40px 20px', color: '#474A4A' }}>Selecciona un grupo para ver el ranking.</div>;
  if (!tabla.length) return <div style={{ textAlign: 'center', padding: '40px 20px', color: '#474A4A' }}>Aún no hay participantes en este grupo. ¡Invita a tus colegas!</div>;

  return (
    <div style={{ paddingTop: 12 }}>
      {grupoNombre && (
        <div style={{ textAlign: 'center', fontSize: '.78rem', color: '#3CAC3B', fontWeight: 700, marginBottom: 10 }}>
          🏆 {grupoNombre}
        </div>
      )}
      {tabla.map((r, i) => {
        const med = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1);
        return (
          <div key={r.id} style={{ background: '#fff', borderRadius: 12, padding: '11px 14px', marginBottom: 8, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', width: 30, textAlign: 'center', color: i === 0 ? '#D4A017' : '#474A4A' }}>{med}</div>
              <div style={{ flex: 1, fontWeight: 600 }}>
                {r.nombre}
                <small style={{ display: 'block', fontWeight: 400, color: '#474A4A', fontSize: '.72rem' }}>{r.exactos} exactos · {r.jugados} jugados</small>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#2A398D', textAlign: 'right' }}>
                {r.total}
                <span style={{ fontSize: '.68rem', fontWeight: 600, color: '#474A4A', display: 'block' }}>puntos</span>
              </div>
            </div>
            {esAdmin && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setConfirmReset(r)} style={{ background: '#fff8e8', border: '1px solid #f0d68a', color: '#9a7400', borderRadius: 8, padding: '5px 10px', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer' }}>🔄 Resetear</button>
                <button onClick={() => setConfirmDelete(r)} style={{ background: '#fff0f0', border: '1px solid #f5a5a5', color: '#c0392b', borderRadius: 8, padding: '5px 10px', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer' }}>🗑 Borrar</button>
              </div>
            )}
          </div>
        );
      })}

      {confirmReset && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 200 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 340, width: '100%' }}>
            <h2 style={{ fontSize: '1.1rem', color: '#9a7400', marginBottom: 8 }}>¿Resetear apuestas?</h2>
            <p style={{ fontSize: '.88rem', color: '#474A4A', marginBottom: 18 }}>
              Se borrarán <b>todas las apuestas</b> de <b>{confirmReset.nombre}</b> en este grupo. Podrá volver a apostar.
            </p>
            <button onClick={() => resetearApuestas(confirmReset)} disabled={busy} style={{ display: 'block', width: '100%', padding: 13, background: '#D4A017', color: '#fff', border: 0, borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', marginBottom: 8, opacity: busy ? .6 : 1 }}>{busy ? 'Borrando…' : 'Sí, resetear'}</button>
            <button onClick={() => setConfirmReset(null)} disabled={busy} style={{ display: 'block', width: '100%', padding: 13, background: '#fff', color: '#2A398D', border: '1px solid #3CAC3B', borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 200 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 340, width: '100%' }}>
            <h2 style={{ fontSize: '1.1rem', color: '#c0392b', marginBottom: 8 }}>¿Borrar usuario?</h2>
            <p style={{ fontSize: '.88rem', color: '#474A4A', marginBottom: 18 }}>
              Se eliminará a <b>{confirmDelete.nombre}</b> junto con todos sus pronósticos. Esta acción no se puede deshacer.
            </p>
            <button onClick={() => borrarParticipante(confirmDelete)} disabled={busy} style={{ display: 'block', width: '100%', padding: 13, background: '#c0392b', color: '#fff', border: 0, borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', marginBottom: 8, opacity: busy ? .6 : 1 }}>{busy ? 'Borrando…' : 'Sí, borrar'}</button>
            <button onClick={() => setConfirmDelete(null)} disabled={busy} style={{ display: 'block', width: '100%', padding: 13, background: '#fff', color: '#2A398D', border: '1px solid #3CAC3B', borderRadius: 12, fontSize: '.95rem', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
