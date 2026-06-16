'use client';
import { useEffect, useState, useCallback } from 'react';
import { sb } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { ALL_MATCHES, flag, FASE_NOMBRE } from '@/lib/matches';
import { calcularPuntos } from '@/lib/scoring';
import type { Resultados, Score } from '@/lib/types';

type Apuesta = { pid: string; nombre: string; score: Score };

const FASES: [string, string][] = [
  ['todos', 'Todos'], ['grupo', 'Grupos'], ['R32', 'Ronda 32'],
  ['R16', 'Octavos'], ['CF', 'Cuartos'], ['SF', 'Semis'], ['FN', 'Final'],
];

export default function ApuestasView({ toast }: { toast: (m: string) => void }) {
  const { esAdmin } = useApp();
  const [resultados, setResultados] = useState<Resultados>({});
  const [porMatch, setPorMatch] = useState<Record<string, Apuesta[]>>({});
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [busy, setBusy] = useState(false);

  const cargar = useCallback(async () => {
    const { data: resData } = await sb.from('polla_resultados').select('*');
    const res: Resultados = {};
    (resData || []).forEach((r: any) => { res[r.match_id] = { l: r.goles_local, v: r.goles_visitante }; });
    setResultados(res);

    const { data: parts } = await sb.from('polla_participantes').select('id,nombre');
    const nombreById: Record<string, string> = {};
    (parts || []).forEach((p: any) => { nombreById[p.id] = p.nombre; });

    const { data: allPron } = await sb.from('polla_pronosticos').select('*');
    const pm: Record<string, Apuesta[]> = {};
    (allPron || []).forEach((p: any) => {
      if (p.goles_local === null || p.goles_visitante === null) return;
      pm[p.match_id] = pm[p.match_id] || [];
      pm[p.match_id].push({ pid: p.participante_id, nombre: nombreById[p.participante_id] || '?', score: { l: p.goles_local, v: p.goles_visitante } });
    });
    Object.values(pm).forEach(arr => arr.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setPorMatch(pm);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function borrarApuesta(pid: string, mid: string, nombre: string) {
    setBusy(true);
    try {
      const { data, error } = await sb.from('polla_pronosticos').delete().eq('participante_id', pid).eq('match_id', mid).select();
      if (error) { toast('Error: ' + error.message); return; }
      if (!data?.length) { toast('No se pudo borrar'); return; }
      toast(`✅ Apuesta de ${nombre} borrada`);
      await cargar();
    } finally { setBusy(false); }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 30, color: '#5a6b5e' }}>Cargando apuestas…</div>;
  if (!Object.keys(porMatch).length) return <div style={{ textAlign: 'center', padding: '40px 20px', color: '#5a6b5e' }}>Aún nadie ha guardado apuestas. Apenas alguien guarde y bloquee, aparecerá aquí.</div>;

  let matches = ALL_MATCHES.filter(m => (porMatch[m.id]?.length || 0) > 0);
  if (filtro === 'grupo') matches = matches.filter(m => m.fase === 'grupo');
  else if (filtro !== 'todos') matches = matches.filter(m => m.fase === filtro);

  return (
    <div style={{ paddingTop: 8 }}>
      <p style={{ fontSize: '.76rem', color: '#5a6b5e', margin: '4px 2px 8px' }}>
        Solo aparecen las apuestas que cada quien ya <b>guardó y bloqueó</b>.
      </p>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 0 10px', WebkitOverflowScrolling: 'touch' as any }}>
        {FASES.map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              whiteSpace: 'nowrap', padding: '6px 13px',
              border: `1px solid ${filtro === f ? '#27AE60' : '#dfe8e1'}`,
              background: filtro === f ? '#EDF7EE' : '#fff',
              borderRadius: 18, fontSize: '.78rem', cursor: 'pointer',
              color: filtro === f ? '#1A6B2F' : '#5a6b5e', fontWeight: 600,
            }}
          >{label}</button>
        ))}
      </div>

      {matches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 20px', color: '#5a6b5e', fontSize: '.88rem' }}>No hay apuestas en esta fase todavía.</div>
      ) : matches.map(m => {
        const real = resultados[m.id];
        const tieneR = real?.l !== null && real?.l !== undefined;
        const faseLabel = m.fase === 'grupo' ? ('Grupo ' + m.grupo) : FASE_NOMBRE[m.fase];
        return (
          <div key={m.id} style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.68rem', color: '#5a6b5e', marginBottom: 6, fontWeight: 600 }}>
              <span style={{ background: m.fase !== 'grupo' ? '#fdf3dd' : '#EDF7EE', color: m.fase !== 'grupo' ? '#9a7400' : '#1A6B2F', padding: '2px 8px', borderRadius: 6 }}>{faseLabel}</span>
              <span>{m.dia} · {m.hora} 🇨🇴</span>
            </div>
            <div style={{ textAlign: 'center', fontSize: '.92rem', fontWeight: 700, marginBottom: 8 }}>
              {flag(m.local)} {m.local} <span style={{ color: '#5a6b5e' }}>vs</span> {m.visitante} {flag(m.visitante)}
              {tieneR && <span style={{ display: 'inline-block', marginLeft: 8, background: '#1A6B2F', color: '#fff', borderRadius: 6, padding: '1px 8px', fontSize: '.8rem' }}>Real {real.l}-{real.v}</span>}
            </div>
            {porMatch[m.id].map(a => {
              const pts = tieneR ? calcularPuntos(a.score, real, m.fase) : null;
              const color = pts === null ? '#5a6b5e' : pts === 0 ? '#c0392b' : pts === 25 ? '#1A6B2F' : '#27AE60';
              return (
                <div key={a.pid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: '1px solid #f0f4f1' }}>
                  <span style={{ flex: 1, fontSize: '.85rem', fontWeight: 600 }}>{a.nombre}</span>
                  <span style={{ background: '#EDF7EE', color: '#1A6B2F', borderRadius: 6, padding: '2px 10px', fontWeight: 800, fontSize: '.85rem' }}>{a.score.l}-{a.score.v}</span>
                  {tieneR && <span style={{ fontSize: '.72rem', fontWeight: 700, color, width: 46, textAlign: 'right' }}>{pts === 0 ? 'Falló' : '+' + pts}</span>}
                  {esAdmin && (
                    <button
                      onClick={() => borrarApuesta(a.pid, m.id, a.nombre)}
                      disabled={busy}
                      title="Borrar esta apuesta"
                      style={{ background: '#fff0f0', border: '1px solid #f5a5a5', color: '#c0392b', borderRadius: 7, padding: '3px 8px', fontSize: '.72rem', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}
                    >🗑</button>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
