'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ALL_MATCHES, GRUPOS_LETRAS, inicioPartido, flag } from '@/lib/matches';
import MatchCard from '@/components/MatchCard';

const FASES = [
  ['todos', 'Todos'], ['grupo', 'Grupos'], ['R32', 'Ronda 32'],
  ['R16', 'Octavos'], ['CF', 'Cuartos'], ['SF', 'Semis'], ['FN', 'Final'],
];

function restanteTexto(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const min = totalMin % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${min}m`;
  return `${min}m`;
}

function ProximoPartido({ now }: { now: number }) {
  const proximos = ALL_MATCHES
    .map(m => ({ m, ini: inicioPartido(m) }))
    .filter((x): x is { m: typeof x.m; ini: Date } => x.ini !== null && x.ini.getTime() > now)
    .sort((a, b) => a.ini.getTime() - b.ini.getTime());

  if (!proximos.length) {
    return (
      <div style={{ background: '#EDF7EE', borderRadius: 12, padding: '10px 14px', margin: '12px 0 4px', fontSize: '.82rem', color: '#5a6b5e', textAlign: 'center' }}>
        No quedan partidos por jugar. ¡Revisa el ranking final! 🏆
      </div>
    );
  }

  const sig = proximos[0];
  const cierran24 = proximos.filter(x => x.ini.getTime() - now <= 24 * 3600000).length;
  const restante = restanteTexto(sig.ini.getTime() - now);

  return (
    <div style={{ background: '#EDF7EE', border: '1px solid #cfe6d4', borderRadius: 12, padding: '10px 14px', margin: '12px 0 4px' }}>
      <div style={{ fontSize: '.72rem', color: '#5a6b5e', fontWeight: 700, marginBottom: 2 }}>
        ⏳ PRÓXIMO PARTIDO · cierra en {restante}
      </div>
      <div style={{ fontSize: '.92rem', fontWeight: 700, color: '#16271c' }}>
        {flag(sig.m.local)} {sig.m.local} <span style={{ color: '#5a6b5e' }}>vs</span> {sig.m.visitante} {flag(sig.m.visitante)}
      </div>
      <div style={{ fontSize: '.72rem', color: '#5a6b5e', marginTop: 2 }}>
        {sig.m.dia} · {sig.m.hora} 🇨🇴
        {cierran24 > 1 && <> · <b>{cierran24}</b> partidos cierran en 24 h</>}
      </div>
    </div>
  );
}

export default function PartidosView({ toast }: { toast: (m: string) => void }) {
  const { usuario, filtroFase, dispatch } = useApp();
  const [now, setNow] = useState<number>(() => Date.now());

  // Refresca cada minuto: mantiene el contador y los candados de "Cerrado" al día.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  if (!usuario) {
    return <div style={{ textAlign: 'center', padding: '40px 20px', color: '#5a6b5e', fontSize: '.9rem' }}>👋 Toca <b>&quot;Entrar&quot;</b> arriba a la derecha para empezar.</div>;
  }
  let lista = ALL_MATCHES;
  if (filtroFase === 'grupo') lista = lista.filter(m => m.fase === 'grupo');
  else if (filtroFase !== 'todos') lista = lista.filter(m => m.fase === filtroFase);

  return (
    <div>
      <ProximoPartido now={now} />
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 0 4px', WebkitOverflowScrolling: 'touch' as any }}>
        {FASES.map(([f, label]) => (
          <button
            key={f}
            onClick={() => dispatch({ type: 'SET_FILTRO', val: f })}
            style={{
              whiteSpace: 'nowrap', padding: '6px 13px',
              border: `1px solid ${filtroFase === f ? '#27AE60' : '#dfe8e1'}`,
              background: filtroFase === f ? '#EDF7EE' : '#fff',
              borderRadius: 18, fontSize: '.78rem', cursor: 'pointer',
              color: filtroFase === f ? '#1A6B2F' : '#5a6b5e', fontWeight: 600,
            }}
          >{label}</button>
        ))}
      </div>
      {filtroFase === 'grupo' ? (
        GRUPOS_LETRAS.map(g => (
          <div key={g}>
            <div style={{ fontWeight: 800, color: '#1A6B2F', margin: '16px 0 8px', fontSize: '1rem', paddingLeft: 4, borderLeft: '4px solid #27AE60' }}>Grupo {g}</div>
            {lista.filter(m => m.grupo === g).map(m => <MatchCard key={m.id} m={m} />)}
          </div>
        ))
      ) : (
        lista.map(m => <MatchCard key={m.id} m={m} />)
      )}
    </div>
  );
}
