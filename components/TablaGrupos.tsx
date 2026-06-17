'use client';
import { useApp } from '@/context/AppContext';
import { ALL_MATCHES, GRUPOS_LETRAS, flag } from '@/lib/matches';

interface TeamStats {
  name: string;
  pj: number; pg: number; pe: number; pp: number;
  gf: number; gc: number;
}

function calcularGrupo(letra: string, resultados: Record<string, { l: number | null; v: number | null }>) {
  const partidos = ALL_MATCHES.filter(m => m.fase === 'grupo' && m.grupo === letra);
  const teams: Record<string, TeamStats> = {};

  for (const m of partidos) {
    for (const name of [m.local, m.visitante]) {
      if (!teams[name]) teams[name] = { name, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 };
    }
    const r = resultados[m.id];
    if (r?.l === null || r?.l === undefined || r?.v === null) continue;
    const hl = r.l as number, hv = r.v as number;

    teams[m.local].pj++;
    teams[m.local].gf += hl;
    teams[m.local].gc += hv;
    teams[m.visitante].pj++;
    teams[m.visitante].gf += hv;
    teams[m.visitante].gc += hl;

    if (hl > hv) {
      teams[m.local].pg++;
      teams[m.visitante].pp++;
    } else if (hl === hv) {
      teams[m.local].pe++;
      teams[m.visitante].pe++;
    } else {
      teams[m.visitante].pg++;
      teams[m.local].pp++;
    }
  }

  return Object.values(teams).sort((a, b) => {
    const pa = a.pg * 3 + a.pe, pb = b.pg * 3 + b.pe;
    if (pa !== pb) return pb - pa;
    const gda = a.gf - a.gc, gdb = b.gf - b.gc;
    if (gda !== gdb) return gdb - gda;
    return b.gf - a.gf;
  });
}

export default function TablaGrupos() {
  const { resultados } = useApp();

  return (
    <div style={{ paddingTop: 8 }}>
      {GRUPOS_LETRAS.map(letra => {
        const tabla = calcularGrupo(letra, resultados);
        const jugados = tabla.some(t => t.pj > 0);
        return (
          <div key={letra} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, color: '#2A398D', marginBottom: 6, fontSize: '.95rem', paddingLeft: 4, borderLeft: '4px solid #3CAC3B' }}>
              Grupo {letra}
            </div>
            <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 28px 28px 28px 28px 28px 34px', gap: 2, padding: '5px 10px', background: '#EEF0F9', fontSize: '.65rem', fontWeight: 700, color: '#474A4A' }}>
                <span>Selección</span>
                <span style={{ textAlign: 'center' }}>PJ</span>
                <span style={{ textAlign: 'center' }}>G</span>
                <span style={{ textAlign: 'center' }}>E</span>
                <span style={{ textAlign: 'center' }}>P</span>
                <span style={{ textAlign: 'center' }}>DG</span>
                <span style={{ textAlign: 'center' }}>Pts</span>
              </div>
              {tabla.map((t, i) => {
                const pts = t.pg * 3 + t.pe;
                const dg = t.gf - t.gc;
                const clasifica = i < 2;
                return (
                  <div
                    key={t.name}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 28px 28px 28px 28px 28px 34px',
                      gap: 2,
                      padding: '7px 10px',
                      borderTop: '1px solid #f0f4f1',
                      background: clasifica && jugados ? '#f0fdf0' : '#fff',
                    }}
                  >
                    <span style={{ fontSize: '.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: '1rem' }}>{flag(t.name)}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                    </span>
                    <span style={{ textAlign: 'center', fontSize: '.78rem', color: '#474A4A' }}>{t.pj}</span>
                    <span style={{ textAlign: 'center', fontSize: '.78rem', color: '#3CAC3B', fontWeight: 700 }}>{t.pg}</span>
                    <span style={{ textAlign: 'center', fontSize: '.78rem', color: '#474A4A' }}>{t.pe}</span>
                    <span style={{ textAlign: 'center', fontSize: '.78rem', color: '#c0392b' }}>{t.pp}</span>
                    <span style={{ textAlign: 'center', fontSize: '.78rem', color: dg > 0 ? '#3CAC3B' : dg < 0 ? '#c0392b' : '#474A4A', fontWeight: 600 }}>{dg > 0 ? '+' : ''}{dg}</span>
                    <span style={{ textAlign: 'center', fontSize: '.88rem', fontWeight: 800, color: '#2A398D' }}>{pts}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <p style={{ fontSize: '.7rem', color: '#474A4A', textAlign: 'center', marginTop: 4 }}>Verde = clasifican a octavos (top 2 del grupo)</p>
    </div>
  );
}
