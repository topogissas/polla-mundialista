'use client';
import { useEffect, useState, useCallback } from 'react';
import { sb } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { ALL_MATCHES, flag, FASE_NOMBRE, inicioPartido, formatHora } from '@/lib/matches';
import { calcularPuntos } from '@/lib/scoring';
import type { Resultados, Score } from '@/lib/types';

type Apuesta = { pid: string; nombre: string; score: Score };

const FASES: [string, string][] = [
  ['todos', 'Todos'], ['grupo', 'Grupos'], ['R32', 'Ronda 32'],
  ['R16', 'Octavos'], ['CF', 'Cuartos'], ['SF', 'Semis'], ['FN', 'Final'],
];

// Resumen personal: mis apuestas vs resultados reales
function MisResultados() {
  const { predicciones, resultados, formatoHora } = useApp();
  const [filtro, setFiltro] = useState('todos');

  const played = ALL_MATCHES.filter(m => {
    const real = resultados[m.id];
    return real?.l !== null && real?.l !== undefined;
  });
  const pending = ALL_MATCHES.filter(m => {
    const real = resultados[m.id];
    return !real || real.l === null || real.l === undefined;
  });

  let matches = filtro === 'pendientes' ? pending : played;
  if (filtro === 'exactos') matches = played.filter(m => {
    const pred = predicciones[m.id];
    const real = resultados[m.id];
    if (!pred || pred.l === null || !real) return false;
    return calcularPuntos(pred, real, m.fase) === 25;
  });
  if (filtro === 'acertados') matches = played.filter(m => {
    const pred = predicciones[m.id];
    const real = resultados[m.id];
    if (!pred || pred.l === null || !real) return false;
    const pts = calcularPuntos(pred, real, m.fase);
    return pts !== null && pts > 0 && pts < 25;
  });

  let pts = 0, exactos = 0, acertados = 0, fallados = 0, sinApuesta = 0;
  played.forEach(m => {
    const pred = predicciones[m.id];
    const real = resultados[m.id];
    if (!pred || pred.l === null) { sinApuesta++; return; }
    const p = calcularPuntos(pred, real!, m.fase);
    if (p === 25) { pts += 25; exactos++; }
    else if (p !== null && p > 0) { pts += p; acertados++; }
    else { fallados++; }
  });

  const chips: [string, string][] = [
    ['todos', `Jugados (${played.length})`],
    ['exactos', `✅ Exactos (${exactos})`],
    ['acertados', `🎯 Acertados (${acertados})`],
    ['pendientes', `⏳ Pendientes (${pending.length})`],
  ];

  return (
    <div style={{ paddingTop: 8 }}>
      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[
          ['pts', String(pts)],
          ['exactos', String(exactos)],
          ['acertados', String(acertados)],
          ['fallados', String(fallados)],
        ].map(([label, val]) => (
          <div key={label} style={{ flex: 1, textAlign: 'center', background: '#EEF0F9', borderRadius: 10, padding: '8px 4px' }}>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#2A398D' }}>{val}</div>
            <div style={{ fontSize: '.65rem', color: '#474A4A', fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 0 10px', WebkitOverflowScrolling: 'touch' as any }}>
        {chips.map(([f, label]) => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            whiteSpace: 'nowrap', padding: '6px 13px',
            border: `1px solid ${filtro === f ? '#3CAC3B' : '#D5D9EB'}`,
            background: filtro === f ? '#EEF0F9' : '#fff',
            borderRadius: 18, fontSize: '.78rem', cursor: 'pointer',
            color: filtro === f ? '#2A398D' : '#474A4A', fontWeight: 600,
          }}>{label}</button>
        ))}
      </div>

      {matches.length === 0 && (
        <div style={{ textAlign: 'center', padding: '30px 20px', color: '#474A4A', fontSize: '.88rem' }}>No hay partidos en esta categoría.</div>
      )}

      {matches.map(m => {
        const pred = predicciones[m.id];
        const real = resultados[m.id];
        const tieneR = real?.l !== null && real?.l !== undefined;
        const ini = inicioPartido(m);
        const ahora = Date.now();
        const enVivo = ini !== null && ahora >= ini.getTime() && ahora < ini.getTime() + 120 * 60 * 1000;
        const pts = tieneR && pred != null && pred.l !== null ? calcularPuntos(pred, real!, m.fase) : null;
        const faseLabel = m.fase === 'grupo' ? ('Grupo ' + m.grupo) : FASE_NOMBRE[m.fase];

        let badge = { bg: '#EEF0F9', color: '#2A398D', label: '⏳ Por jugar' };
        if (tieneR) {
          if (!pred || pred.l === null) badge = { bg: '#f0f4f1', color: '#474A4A', label: '— Sin apuesta' };
          else if (enVivo) badge = { bg: '#e53935', color: '#fff', label: '🔴 En juego' };
          else if (pts === 25) badge = { bg: '#2A398D', color: '#fff', label: '✅ Exacto +25' };
          else if (pts !== null && pts > 0) badge = { bg: '#3CAC3B', color: '#fff', label: `🎯 Acertado +${pts}` };
          else badge = { bg: '#cfd8d2', color: '#fff', label: '❌ Fallaste' };
        }

        return (
          <div key={m.id} style={{ background: '#fff', borderRadius: 12, padding: '11px 14px', marginBottom: 8, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem', color: '#474A4A', marginBottom: 6, fontWeight: 600 }}>
              <span style={{ background: m.fase !== 'grupo' ? '#fdf3dd' : '#EEF0F9', color: m.fase !== 'grupo' ? '#9a7400' : '#2A398D', padding: '2px 8px', borderRadius: 6 }}>{faseLabel}</span>
              <span>{m.dia} · {formatHora(m.hora, formatoHora)} 🇨🇴</span>
            </div>
            <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '.9rem', marginBottom: 8 }}>
              {flag(m.local)} {m.local} <span style={{ color: '#474A4A' }}>vs</span> {m.visitante} {flag(m.visitante)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, fontSize: '.82rem', marginBottom: 6 }}>
              {tieneR && <span>Real: <b>{real!.l}-{real!.v}</b></span>}
              {pred && pred.l !== null && <span>Tú: <b>{pred.l}-{pred.v}</b></span>}
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ background: badge.bg, color: badge.color, borderRadius: 8, padding: '3px 12px', fontSize: '.76rem', fontWeight: 700 }}>{badge.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Admin view: all bets per match, filtered by group
export default function ApuestasView({ toast }: { toast: (m: string) => void }) {
  const { esAdmin, grupoId, formatoHora, usuario } = useApp();
  const [vistaAdmin, setVistaAdmin] = useState(false);

  if (!usuario) return <div style={{ textAlign: 'center', padding: '40px 20px', color: '#474A4A' }}>Entra primero para ver tus resultados.</div>;

  const toggleBtn = (
    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
      <button onClick={() => setVistaAdmin(false)} style={{ flex: 1, padding: '7px 0', borderRadius: 9, fontWeight: 700, fontSize: '.8rem', cursor: 'pointer', border: 'none', background: !vistaAdmin ? '#2A398D' : '#EEF0F9', color: !vistaAdmin ? '#fff' : '#474A4A' }}>Mis resultados</button>
      <button onClick={() => setVistaAdmin(true)} style={{ flex: 1, padding: '7px 0', borderRadius: 9, fontWeight: 700, fontSize: '.8rem', cursor: 'pointer', border: 'none', background: vistaAdmin ? '#2A398D' : '#EEF0F9', color: vistaAdmin ? '#fff' : '#474A4A' }}>Ver todos</button>
    </div>
  );

  if (!vistaAdmin) return <div style={{ paddingTop: 4 }}>{toggleBtn}<MisResultados /></div>;
  return <div style={{ paddingTop: 4 }}>{toggleBtn}<AdminApuestasView toast={toast} grupoId={grupoId} formatoHora={formatoHora} esAdmin={esAdmin} /></div>;
}

function AdminApuestasView({ toast, grupoId, formatoHora, esAdmin = false }: { toast: (m: string) => void; grupoId: string | null; formatoHora: '12h' | '24h'; esAdmin?: boolean }) {
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

    let query = sb.from('polla_pronosticos').select('*');
    if (grupoId) query = query.eq('grupo_id', grupoId) as any;
    const { data: allPron } = await query;

    const pm: Record<string, Apuesta[]> = {};
    (allPron || []).forEach((p: any) => {
      if (p.goles_local === null || p.goles_visitante === null) return;
      pm[p.match_id] = pm[p.match_id] || [];
      pm[p.match_id].push({ pid: p.participante_id, nombre: nombreById[p.participante_id] || '?', score: { l: p.goles_local, v: p.goles_visitante } });
    });
    Object.values(pm).forEach(arr => arr.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setPorMatch(pm);
    setLoading(false);
  }, [grupoId]);

  useEffect(() => { cargar(); }, [cargar]);

  async function borrarApuesta(pid: string, mid: string, nombre: string) {
    setBusy(true);
    try {
      let query = sb.from('polla_pronosticos').delete().eq('participante_id', pid).eq('match_id', mid);
      if (grupoId) query = (query as any).eq('grupo_id', grupoId);
      const { data, error } = await (query as any).select();
      if (error) { toast('Error: ' + error.message); return; }
      if (!data?.length) { toast('No se pudo borrar'); return; }
      toast(`✅ Apuesta de ${nombre} borrada`);
      await cargar();
    } finally { setBusy(false); }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 30, color: '#474A4A' }}>Cargando apuestas…</div>;
  if (!Object.keys(porMatch).length) return <div style={{ textAlign: 'center', padding: '40px 20px', color: '#474A4A' }}>Aún nadie ha guardado apuestas en este grupo.</div>;

  let matches = ALL_MATCHES.filter(m => (porMatch[m.id]?.length || 0) > 0);
  if (filtro === 'grupo') matches = matches.filter(m => m.fase === 'grupo');
  else if (filtro !== 'todos') matches = matches.filter(m => m.fase === filtro);

  return (
    <div style={{ paddingTop: 8 }}>
      <p style={{ fontSize: '.76rem', color: '#474A4A', margin: '4px 2px 8px' }}>
        Solo aparecen las apuestas que cada quien ya <b>guardó y bloqueó</b>.
      </p>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 0 10px', WebkitOverflowScrolling: 'touch' as any }}>
        {FASES.map(([f, label]) => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            whiteSpace: 'nowrap', padding: '6px 13px',
            border: `1px solid ${filtro === f ? '#3CAC3B' : '#D5D9EB'}`,
            background: filtro === f ? '#EEF0F9' : '#fff',
            borderRadius: 18, fontSize: '.78rem', cursor: 'pointer',
            color: filtro === f ? '#2A398D' : '#474A4A', fontWeight: 600,
          }}>{label}</button>
        ))}
      </div>

      {matches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 20px', color: '#474A4A', fontSize: '.88rem' }}>No hay apuestas en esta fase todavía.</div>
      ) : matches.map(m => {
        const real = resultados[m.id];
        const tieneR = real?.l !== null && real?.l !== undefined;
        const ini = inicioPartido(m);
        const ahora = Date.now();
        const enVivo = ini !== null && ahora >= ini.getTime() && ahora < ini.getTime() + 120 * 60 * 1000;
        const faseLabel = m.fase === 'grupo' ? ('Grupo ' + m.grupo) : FASE_NOMBRE[m.fase];
        return (
          <div key={m.id} style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.68rem', color: '#474A4A', marginBottom: 6, fontWeight: 600 }}>
              <span style={{ background: m.fase !== 'grupo' ? '#fdf3dd' : '#EEF0F9', color: m.fase !== 'grupo' ? '#9a7400' : '#2A398D', padding: '2px 8px', borderRadius: 6 }}>{faseLabel}</span>
              <span>{m.dia} · {formatHora(m.hora, formatoHora)} 🇨🇴</span>
            </div>
            <div style={{ textAlign: 'center', fontSize: '.92rem', fontWeight: 700, marginBottom: 8 }}>
              {flag(m.local)} {m.local} <span style={{ color: '#474A4A' }}>vs</span> {m.visitante} {flag(m.visitante)}
              {tieneR && <span style={{ display: 'inline-block', marginLeft: 8, background: '#2A398D', color: '#fff', borderRadius: 6, padding: '1px 8px', fontSize: '.8rem' }}>Real {real.l}-{real.v}</span>}
            </div>
            {porMatch[m.id].map(a => {
              const pts = tieneR ? calcularPuntos(a.score, real, m.fase) : null;
              const color = pts === null ? '#474A4A' : pts === 0 ? '#c0392b' : pts === 25 ? '#2A398D' : '#3CAC3B';
              const etiqueta = enVivo ? '🔴' : pts === 0 ? 'Falló' : '+' + pts;
              const etqColor = enVivo ? '#e53935' : color;
              return (
                <div key={a.pid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: '1px solid #f0f4f1' }}>
                  <span style={{ flex: 1, fontSize: '.85rem', fontWeight: 600 }}>{a.nombre}</span>
                  <span style={{ background: '#EEF0F9', color: '#2A398D', borderRadius: 6, padding: '2px 10px', fontWeight: 800, fontSize: '.85rem' }}>{a.score.l}-{a.score.v}</span>
                  {tieneR && <span style={{ fontSize: '.72rem', fontWeight: 700, color: etqColor, width: 46, textAlign: 'right' }}>{etiqueta}</span>}
                  {esAdmin && <button onClick={() => borrarApuesta(a.pid, m.id, a.nombre)} disabled={busy} title="Borrar esta apuesta" style={{ background: '#fff0f0', border: '1px solid #f5a5a5', color: '#c0392b', borderRadius: 7, padding: '3px 8px', fontSize: '.72rem', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}>🗑</button>}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
