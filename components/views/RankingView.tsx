'use client';
import { useEffect, useState } from 'react';
import { sb } from '@/lib/supabase';
import { ALL_MATCHES } from '@/lib/matches';
import { calcularPuntos } from '@/lib/scoring';
import type { RankingEntry, Resultados } from '@/lib/types';

export default function RankingView() {
  const [tabla, setTabla] = useState<RankingEntry[] | null>(null);

  useEffect(() => {
    (async () => {
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
              const mult = m.fase === 'grupo' ? 1 : 2;
              if (pts >= 5 * mult) exactos++;
            }
          }
        });
        return { nombre: p.nombre, total, exactos, jugados };
      }).sort((a, b) => b.total - a.total || b.exactos - a.exactos);
      setTabla(t);
    })();
  }, []);

  if (!tabla) return <div style={{ textAlign: 'center', padding: 30, color: '#5a6b5e' }}>Calculando ranking…</div>;
  if (!tabla.length) return <div style={{ textAlign: 'center', padding: '40px 20px', color: '#5a6b5e' }}>Aún no hay participantes. ¡Invita a tus amigos!</div>;

  return (
    <div style={{ paddingTop: 12 }}>
      {tabla.map((r, i) => {
        const med = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1);
        return (
          <div key={r.nombre} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 12, padding: '11px 14px', marginBottom: 8, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
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
        );
      })}
    </div>
  );
}
