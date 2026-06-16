'use client';
import { useApp } from '@/context/AppContext';
import { ALL_MATCHES, GRUPOS_LETRAS } from '@/lib/matches';
import MatchCard from '@/components/MatchCard';

const FASES: [string, string][] = [
  ['todos', 'Todos'], ['grupo', 'Grupos'], ['R32', 'Ronda 32'],
  ['R16', 'Octavos'], ['CF', 'Cuartos'], ['SF', 'Semis'], ['FN', 'Final'],
];

export default function CalendarioView() {
  const { usuario, filtroFase, dispatch } = useApp();

  if (!usuario) {
    return <div style={{ textAlign: 'center', padding: '40px 20px', color: '#5a6b5e', fontSize: '.9rem' }}>👋 Toca <b>&quot;Entrar&quot;</b> arriba a la derecha para empezar.</div>;
  }

  let lista = ALL_MATCHES;
  if (filtroFase === 'grupo') lista = lista.filter(m => m.fase === 'grupo');
  else if (filtroFase !== 'todos') lista = lista.filter(m => m.fase === filtroFase);

  return (
    <div>
      <p style={{ fontSize: '.76rem', color: '#5a6b5e', margin: '10px 2px 4px' }}>
        Todos los partidos del torneo. Puedes apostar los que sigan abiertos (cierran 5 min antes).
      </p>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '6px 0 4px', WebkitOverflowScrolling: 'touch' as any }}>
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
